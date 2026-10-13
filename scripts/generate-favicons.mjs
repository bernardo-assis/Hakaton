import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const publicDir = path.resolve("frontend/public");

// Create temporary HTML that centers the SVG at exactly 64x64 on transparent canvas
const tempHtml = path.resolve("scripts/favicon-canvas.html");
fs.writeFileSync(
  tempHtml,
  `<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 64px; height: 64px; background: transparent; overflow: hidden; display: flex; align-items: center; justify-content: center; }
  img { width: 64px; height: 64px; }
</style>
</head>
<body>
  <img src="file:///${path.resolve("frontend/public/favicon.svg").replace(/\\/g, "/")}" />
</body>
</html>`
);

const png64 = path.join(publicDir, "favicon-64.png");
execFileSync(edgePath, [
  "--headless=new",
  "--disable-gpu",
  "--default-background-color=00000000",
  "--window-size=64,64",
  `--screenshot=${png64}`,
  `file:///${tempHtml.replace(/\\/g, "/")}`,
]);

// Convert to 32x32 and 180x180 and ico with ffmpeg
const png32 = path.join(publicDir, "favicon-32x32.png");
const appleIcon = path.join(publicDir, "apple-touch-icon.png");
const ico = path.join(publicDir, "favicon.ico");

execFileSync("ffmpeg", ["-y", "-i", png64, "-vf", "scale=32:32", png32]);
execFileSync("ffmpeg", ["-y", "-i", png64, "-vf", "scale=180:180", appleIcon]);
execFileSync("ffmpeg", ["-y", "-i", png64, "-vf", "scale=32:32", ico]);

console.log("Favicons generated:");
console.log("- favicon-64.png:", fs.statSync(png64).size, "bytes");
console.log("- favicon-32x32.png:", fs.statSync(png32).size, "bytes");
console.log("- apple-touch-icon.png:", fs.statSync(appleIcon).size, "bytes");
console.log("- favicon.ico:", fs.statSync(ico).size, "bytes");

if (fs.existsSync(tempHtml)) fs.unlinkSync(tempHtml);
