import { readdir, stat } from "node:fs/promises";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDirectory = join(projectRoot,"dist");

export const BUILD_BUDGETS = Object.freeze({
  javascriptBytes:768 * 1024,
  cssBytes:64 * 1024,
  wasmBytes:768 * 1024,
  deployableBytes:1792 * 1024,
  sourceMapBytes:3 * 1024 * 1024
});

async function listFiles(directory) {
  const entries = await readdir(directory,{ withFileTypes:true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory,entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  }));
  return nested.flat().sort((left,right) => left.localeCompare(right));
}

function sumBytes(files, sizes) {
  return files.reduce((total,file) => total + sizes.get(file),0);
}

function formatBytes(bytes) {
  return `${bytes.toLocaleString("en-US")} B`;
}

export async function checkBuildPerformanceBudget() {
  const files = await listFiles(outputDirectory);
  const sizes = new Map(await Promise.all(files.map(async (file) => [file,(await stat(file)).size])));
  const sourceMaps = files.filter((file) => file.endsWith(".map"));
  const deployable = files.filter((file) => !file.endsWith(".map"));
  const javascript = deployable.filter((file) => extname(file) === ".js");
  const css = deployable.filter((file) => extname(file) === ".css");
  const wasm = deployable.filter((file) => extname(file) === ".wasm");
  const measurements = [
    ["JavaScript",sumBytes(javascript,sizes),BUILD_BUDGETS.javascriptBytes],
    ["CSS",sumBytes(css,sizes),BUILD_BUDGETS.cssBytes],
    ["WebAssembly",sumBytes(wasm,sizes),BUILD_BUDGETS.wasmBytes],
    ["deployable output",sumBytes(deployable,sizes),BUILD_BUDGETS.deployableBytes],
    ["source maps",sumBytes(sourceMaps,sizes),BUILD_BUDGETS.sourceMapBytes]
  ];
  const violations = measurements.filter(([,actual,limit]) => actual > limit);

  console.log("Performance build budget");
  for (const [label,actual,limit] of measurements) {
    const status = actual <= limit ? "PASS" : "FAIL";
    console.log(`  ${status} ${label}: ${formatBytes(actual)} / ${formatBytes(limit)}`);
  }
  if (files.length === 0) violations.push(["build output",0,1]);
  if (violations.length > 0) {
    const details = violations.map(([label,actual,limit]) =>
      `${label} is ${formatBytes(actual)} (budget ${formatBytes(limit)})`
    ).join("; ");
    throw new Error(`Performance build budget failed: ${details}.`);
  }

  return {
    outputDirectory:relative(projectRoot,outputDirectory),
    files:files.length,
    measurements:measurements.map(([label,actual,limit]) => ({ label, actual, limit }))
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === join(projectRoot,relative(projectRoot,process.argv[1]))) {
  checkBuildPerformanceBudget().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
