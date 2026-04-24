import { mkdir, rm, cp, copyFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = process.cwd();
const DIST_DIR = join(ROOT, "dist");
const SITE_PATHS = ["index.html", "src", "data"];

async function main() {
  await rm(DIST_DIR, { recursive: true, force: true });
  await mkdir(DIST_DIR, { recursive: true });

  for (const sitePath of SITE_PATHS) {
    const source = join(ROOT, sitePath);
    const target = join(DIST_DIR, sitePath);
    await cp(source, target, { recursive: true });
  }

  await copyFile(join(ROOT, "index.html"), join(DIST_DIR, "404.html"));
  await writeFile(join(DIST_DIR, ".nojekyll"), "", "utf8");

  console.log(`GitHub Pages artifact ready: ${DIST_DIR}`);
}

main().catch((error) => {
  console.error("Failed to build GitHub Pages artifact.");
  console.error(error);
  process.exitCode = 1;
});
