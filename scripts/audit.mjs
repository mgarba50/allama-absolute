import fs from "node:fs";

const spec = fs.readFileSync("ALLAMA_ABSOLUTE_MASTER_SPEC.md","utf8");
const map = JSON.parse(fs.readFileSync("audit/implementation-map.json","utf8"));

const sections = [];
for (const line of spec.split(/\r?\n/)) {
  const match = line.match(/^#\s+([IVXLCDM]+)\.\s+(.+)$/);
  if (match) sections.push({ id:match[1], title:match[2].trim() });
}

const validStatuses = new Set(["core","partial","pending","data-blocked"]);
const terminalStatuses = new Set(["core","data-blocked"]);
const strict = process.argv.includes("--strict");

const requirements = sections.map((section) => {
  const mapped = map[section.id] ?? { status:"pending", evidence:[] };
  const status = String(mapped.status ?? "pending").toLowerCase();
  const evidence = Array.isArray(mapped.evidence) ? mapped.evidence : [];
  const tests = Array.isArray(mapped.tests)
    ? mapped.tests
    : evidence.filter((path) => path === "tests" || path.startsWith("tests/"));
  const docs = Array.isArray(mapped.docs)
    ? mapped.docs
    : evidence.filter((path) => path === "README.md" || path.startsWith("docs/"));
  const blockers = Array.isArray(mapped.blockers) ? mapped.blockers : [];
  const references = [...new Set([...evidence,...tests,...docs])];
  const missingEvidence = references.filter((path) => !fs.existsSync(path));
  return { ...section,status,evidence,tests,docs,blockers,missingEvidence };
});

const forbidden = ["TODO","FIXME","coming soon","not implemented","placeholder"];
const sourceFiles = [];

function collect(directory) {
  if (!fs.existsSync(directory)) return;
  for (const name of fs.readdirSync(directory)) {
    const path = directory + "/" + name;
    const stat = fs.statSync(path);
    if (stat.isDirectory()) collect(path);
    else if (/\.(ts|tsx|js|mjs)$/.test(path)) sourceFiles.push(path);
  }
}

collect("src");

const violations = [];
for (const file of sourceFiles) {
  const source = fs.readFileSync(file,"utf8")
    // An input hint property is not an implementation placeholder.
    .replace(/\bplaceholder\s*[:=]|\.placeholder\b/gi,"")
    .toLowerCase();
  for (const token of forbidden) {
    if (source.includes(token.toLowerCase())) violations.push({ file,token });
  }
}

const counts = requirements.reduce((acc,item) => {
  acc[item.status] = (acc[item.status] ?? 0) + 1;
  return acc;
},{});

const invalidStatuses = requirements
  .filter((item) => !validStatuses.has(item.status))
  .map((item) => ({ section:item.id,status:item.status }));
const invalidDataBlocked = requirements
  .filter((item) => item.status === "data-blocked" && item.blockers.length === 0)
  .map((item) => ({ section:item.id,reason:"DATA-BLOCKED requires an explicit blocker." }));

const report = {
  generatedAt:new Date().toISOString(),
  specificationSections:requirements.length,
  counts,
  allCore:requirements.every((item) => item.status === "core"),
  allTerminal:requirements.every((item) => terminalStatuses.has(item.status)),
  strict,
  invalidStatuses,
  invalidDataBlocked,
  missingEvidenceReferences:requirements.flatMap((item) => item.missingEvidence.map((path) => ({ section:item.id,path }))),
  forbiddenMarkerViolations:violations,
  requirements
};

fs.writeFileSync("completion-audit.generated.json",JSON.stringify(report,null,2) + "\n");

console.log(JSON.stringify({
  specificationSections:report.specificationSections,
  counts:report.counts,
  missingEvidenceReferences:report.missingEvidenceReferences.length,
  forbiddenMarkerViolations:violations.length,
  invalidStatuses:invalidStatuses.length,
  invalidDataBlocked:invalidDataBlocked.length,
  allCore:report.allCore,
  allTerminal:report.allTerminal,
  strict
},null,2));

if (
  report.missingEvidenceReferences.length ||
  violations.length ||
  invalidStatuses.length ||
  invalidDataBlocked.length ||
  (strict && !report.allTerminal)
) process.exitCode = 1;
