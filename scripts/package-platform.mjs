import { mkdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const platform = process.argv[2];
if (platform !== "poki" && platform !== "crazygames") {
  throw new Error("Usage: node scripts/package-platform.mjs <poki|crazygames>");
}

const source = resolve(`dist-${platform}`);
const exportsDirectory = resolve("exports");
const archive = resolve(exportsDirectory, `pocket-earth-${platform}.zip`);

mkdirSync(exportsDirectory, { recursive: true });
rmSync(archive, { force: true });

const result =
  process.platform === "win32"
    ? spawnSync(
        "tar",
        ["-a", "-c", "-f", archive, "-C", source, "."],
        { stdio: "inherit" },
      )
    : spawnSync("zip", ["-q", "-r", archive, "."], {
        cwd: source,
        stdio: "inherit",
      });

if (result.status !== 0) {
  throw new Error(`Unable to create ${archive}`);
}

console.log(archive);
