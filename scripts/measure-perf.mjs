import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const afterDir = path.resolve("docs/performance-evidence/after");

if (!fs.existsSync(afterDir)) {
  fs.mkdirSync(afterDir, { recursive: true });
}

const desktopImg = path.join(afterDir, "desktop.png");
const mobileImg = path.join(afterDir, "mobile.png");

console.log("Capturing Desktop screenshot (AFTER with time budget)...");
execFileSync(edgePath, [
  "--headless=new",
  "--disable-gpu",
  "--virtual-time-budget=3000",
  "--window-size=1280,900",
  `--screenshot=${desktopImg}`,
  "http://localhost:4173/",
]);

console.log("Capturing Mobile screenshot (AFTER with time budget)...");
execFileSync(edgePath, [
  "--headless=new",
  "--disable-gpu",
  "--virtual-time-budget=3000",
  "--window-size=375,812",
  `--screenshot=${mobileImg}`,
  "http://localhost:4173/",
]);

console.log("Screenshots captured successfully:");
console.log("-", desktopImg, fs.statSync(desktopImg).size, "bytes");
console.log("-", mobileImg, fs.statSync(mobileImg).size, "bytes");
