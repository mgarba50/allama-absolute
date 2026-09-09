import fs from "node:fs";

const spec = fs.readFileSync("ALLAMA_ABSOLUTE_MASTER_SPEC.md","utf8");
const sections = [];
for (const line of spec.split(/\r?\n/)) {
  const match = line.match(/^#\s+([IVXLCDM]+)\.?(?:\s+)(.+)$/);
  if (match) sections.push({ id: match[1], title: match[2].trim() });
}

const implemented = new Set([
  "II","VII","VIII","X","XXI","XXII","XIII","XXVI","LXVIII","LXIX","LXX","LXXVI","LXXVII","LXXIX","LXXXII","CXVII","CXIX"
]);

const requirements = sections.map((section) => ({
  ...section,
  status: implemented.has(section.id) ? "implemented-core" : "not-yet-complete"
}));

const forbidden = ["TODO","FIXME","coming soon","not implemented","placeholder"];
const scanFiles = ["src/App.tsx"].concat(fs.readdirSync("src/core").map((file) => "src/core/" + file));
const violations = [];
for (const file of scanFiles) {
  const source = fs.readFileSync(file,"utf8").toLowerCase();
  for (const token of forbidden) {
    if (source.includes(token.toLowerCase())) violations.push({ file, token });
  }
}

const report = {
  generated_at: new Date().toISOString(),
  requirement_count: requirements.length,
  implemented_core_count: requirements.filter((item) => item.status === "implemented-core").length,
  requirements,
  forbidden_marker_violations: violations
};

fs.writeFileSync("completion-audit.generated.json", JSON.stringify(report,null,2) + "\n");
console.log(JSON.stringify({
  requirements: report.requirement_count,
  implementedCore: report.implemented_core_count,
  forbiddenMarkerViolations: violations.length
}, null, 2));

process.exitCode = violations.length ? 1 : 0;
