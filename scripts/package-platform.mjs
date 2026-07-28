import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const platform = process.argv[2];
if (platform !== "poki" && platform !== "crazygames") {
  throw new Error("Usage: node scripts/package-platform.mjs <poki|crazygames>");
}

const source = resolve(`dist-${platform}`);
const exportsDirectory = resolve("exports");
const timestamp = formatDateHour(new Date());
const archive = resolve(
  exportsDirectory,
  `pocket-planet-${platform}-${timestamp}.zip`,
);
const archiveEntries = readdirSync(source);

mkdirSync(exportsDirectory, { recursive: true });
rmSync(archive, { force: true });

const result =
  process.platform === "win32"
    ? spawnSync(
        "tar",
        ["-a", "-c", "-f", archive, "-C", source, ...archiveEntries],
        { stdio: "inherit" },
      )
    : spawnSync("zip", ["-q", "-r", archive, ...archiveEntries], {
        cwd: source,
        stdio: "inherit",
      });

if (result.status !== 0) {
  throw new Error(`Unable to create ${archive}`);
}

const listing =
  process.platform === "win32"
    ? spawnSync("tar", ["-tf", archive], { encoding: "utf8" })
    : spawnSync("unzip", ["-Z1", archive], { encoding: "utf8" });

if (
  listing.status !== 0 ||
  !listing.stdout.split(/\r?\n/).includes("index.html")
) {
  rmSync(archive, { force: true });
  throw new Error(`Archive must contain index.html at its root: ${archive}`);
}

console.log(archive);

function formatDateHour(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
  ].join("");
}
