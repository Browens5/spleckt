import { cpSync, existsSync, mkdirSync, rmSync, readdirSync } from "fs";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "public", "editor");
const tag = process.env.SUPERSPLAT_TAG || "v2.31.1";
const work = path.join(os.tmpdir(), `supersplat-${tag}`);

console.log(`Building SuperSplat editor (${tag})…`);

if (!existsSync(path.join(work, "package.json"))) {
  execSync(
    `git clone --depth 1 --branch ${tag} https://github.com/playcanvas/supersplat.git "${work}"`,
    { stdio: "inherit" },
  );
}

execSync("npm install", { cwd: work, stdio: "inherit" });
execSync("npm run build", { cwd: work, stdio: "inherit" });

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(path.join(work, "dist"), target, { recursive: true });

function removeMaps(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) removeMaps(full);
    else if (entry.name.endsWith(".map")) rmSync(full);
  }
}

removeMaps(target);
console.log("Installed SuperSplat editor to public/editor");
