import { access, copyFile, cp, unlink } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const serverDir = resolve(root, "dist", "server");
const clientDir = resolve(root, "dist", "client");

async function copyIfExists(source, destination) {
  try {
    await access(source);
  } catch {
    return;
  }
  await copyFile(source, destination);
}

async function copyDirectoryIfExists(source, destination) {
  try {
    await access(source);
  } catch {
    return;
  }
  await cp(source, destination, { recursive: true, force: true });
}

async function removeIfExists(target) {
  try {
    await unlink(target);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
}

await access(resolve(serverDir, "index.js"));
await access(clientDir);

await copyFile(resolve(serverDir, "index.js"), resolve(clientDir, "_worker.js"));
await copyFile(resolve(serverDir, "index.js"), resolve(clientDir, "index.js"));

await Promise.all([
  copyIfExists(resolve(serverDir, "__vite_rsc_assets_manifest.js"), resolve(clientDir, "__vite_rsc_assets_manifest.js")),
  copyIfExists(resolve(serverDir, "image-config.json"), resolve(clientDir, "image-config.json")),
  copyIfExists(resolve(serverDir, "vinext-externals.json"), resolve(clientDir, "vinext-externals.json")),
  copyIfExists(resolve(serverDir, "vinext-server.json"), resolve(clientDir, "vinext-server.json")),
  copyDirectoryIfExists(resolve(serverDir, "assets"), resolve(clientDir, "assets")),
  copyDirectoryIfExists(resolve(serverDir, "ssr"), resolve(clientDir, "ssr")),
]);

await removeIfExists(resolve(root, ".wrangler", "deploy", "config.json"));

console.log("Cloudflare Pages output is ready at dist/client.");
