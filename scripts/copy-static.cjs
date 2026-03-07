const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const distRoot = path.join(projectRoot, "dist");
const staticEntries = [
  "assets",
  "components",
  "css",
  "docs",
  "pages",
  "LICENSE",
  "README.md",
  "index.html",
  "package.json"
];

fs.mkdirSync(distRoot, { recursive: true });

for (const entry of staticEntries) {
  const sourcePath = path.join(projectRoot, entry);
  const targetPath = path.join(distRoot, entry);

  if (!fs.existsSync(sourcePath)) {
    continue;
  }

  fs.cpSync(sourcePath, targetPath, {
    recursive: true,
    force: true,
  });
}