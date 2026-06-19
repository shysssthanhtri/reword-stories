import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const configPath = resolve(root, "openapi/generate.config.json");
const filter = process.argv[2];

/** @type {{ input: string; output: string }[]} */
const config = JSON.parse(readFileSync(configPath, "utf8"));

function specStem(inputPath) {
  const name = basename(inputPath);
  return name.endsWith(".openapi.json")
    ? name.slice(0, -".openapi.json".length)
    : name.replace(/\.[^.]+$/, "");
}

const entries = filter
  ? config.filter((entry) => specStem(entry.input) === filter)
  : config;

if (filter && entries.length === 0) {
  console.error(`No OpenAPI config entry matches filter "${filter}"`);
  process.exit(1);
}

for (const { input, output } of entries) {
  const inputPath = resolve(root, input);
  const outputPath = resolve(root, output);

  if (!existsSync(inputPath)) {
    console.error(`Missing OpenAPI snapshot: ${input}`);
    process.exit(1);
  }

  const result = spawnSync(
    "pnpm",
    ["exec", "openapi-typescript", inputPath, "-o", outputPath],
    { cwd: root, stdio: "inherit" }
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  console.log(`Generated ${output} from ${input}`);
}
