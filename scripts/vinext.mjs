import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const command = process.argv[2] || "build";
const cli = resolve(root, "node_modules", "vinext", "dist", "cli.js");

const result = spawnSync(process.execPath, [cli, command, ...process.argv.slice(3)], {
  cwd: root,
  env: {
    ...process.env,
    WRANGLER_LOG_PATH: process.env.WRANGLER_LOG_PATH || ".wrangler/wrangler.log",
  },
  stdio: "inherit",
});

process.exit(result.status ?? 1);
