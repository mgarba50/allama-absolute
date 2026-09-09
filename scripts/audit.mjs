import fs from "node:fs";

const spec = fs.readFileSync("ALLAMA_ABSOLUTE_MASTER_SPEC.md","utf8");
const map = JSON.parse(fs.readFileSync("audit/implementation-map.json","utf8"));

const sections = [];
for (const line of spec.split(/\r?\n/)) {
  const match = line.match(/^#\s+([IVXLCDM]+)\.\s+(.+)$/);
  if (match) sections.push({ id:match[1], title:match[2].trim() });
}

const requirements = sections.map((section) => {
  const mapped = map[section.id] ?? { status:"pending", evidence:[] };
  const missingEvidence = mapped.evidence.filter((path) => !fs.existsSync(path));
  return { ...section,status:mapped.status,evidence:mapped.evidence,missingEvidence };
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
  const source = fs.readFileSync(file,"utf8").toLowerCase();
  for (const token of forbidden) {
    if (source.includes(token.toLowerCase())) violations.push({ file,token });
  }
}

const counts = requirements.reduce((acc,item) => {
  acc[item.status] = (acc[item.status] ?? 0) + 1;
  return acc;
},{});

const report = {
  generatedAt:new Date().toISOString(),
  specificationSections:requirements.length,
  counts,
  allCore:requirements.every((item) => item.status === "core"),
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
  allCore:report.allCore
},null,2));

if (report.missingEvidenceReferences.length || violations.length) process.exitCode = 1;
