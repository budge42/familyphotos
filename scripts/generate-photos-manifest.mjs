import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const photosDir = path.join(rootDir, "photos");
const outputFile = path.join(photosDir, "photos.js");

const imageExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".avif",
  ".heic",
  ".heif",
]);

const files = fs
  .readdirSync(photosDir)
  .filter((fileName) => imageExtensions.has(path.extname(fileName).toLowerCase()))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

const lines = [
  "window.FAMILY_PHOTOS_MANIFEST = [",
  ...files.map((fileName) => `  ${JSON.stringify(`photos/${fileName}`)},`),
  "];",
  "",
];

fs.writeFileSync(outputFile, lines.join("\n"));
console.log(`Updated ${path.relative(rootDir, outputFile)} with ${files.length} photos.`);
