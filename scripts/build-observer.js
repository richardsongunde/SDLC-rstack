#!/usr/bin/env node
/**
 * scripts/build-observer.js
 *
 * Builds the rstack-observer standalone binary for Windows, macOS, and Linux.
 * Uses `pkg` (https://github.com/vercel/pkg) to bundle Node.js + the observer
 * into a single executable — no Node.js installation required on the target machine.
 *
 * Prerequisites:
 *   npm install --save-dev pkg        (or: npx pkg)
 *
 * Usage:
 *   node scripts/build-observer.js                 # all three platforms
 *   node scripts/build-observer.js --win           # Windows only
 *   node scripts/build-observer.js --mac           # macOS only
 *   node scripts/build-observer.js --linux         # Linux only
 *   node scripts/build-observer.js --win --mac     # Win + Mac
 */

import { spawnSync, execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const ENTRY = path.join(ROOT, "bin", "rstack-observer.js");

// ─── parse flags ──────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const buildAll = argv.length === 0;
const buildWin = buildAll || argv.includes("--win");
const buildMac = buildAll || argv.includes("--mac");
const buildLinux = buildAll || argv.includes("--linux");

// ─── target definitions ───────────────────────────────────────────────────────
const TARGETS = [
  {
    name: "Windows",
    flag: buildWin,
    pkgTarget: "node18-win-x64",
    output: path.join(DIST, "rstack-observer-win.exe"),
    artifact: "rstack-observer-win.exe",
  },
  {
    name: "macOS",
    flag: buildMac,
    pkgTarget: "node18-macos-x64",
    output: path.join(DIST, "rstack-observer-macos"),
    artifact: "rstack-observer-macos",
  },
  {
    name: "Linux",
    flag: buildLinux,
    pkgTarget: "node18-linux-x64",
    output: path.join(DIST, "rstack-observer-linux"),
    artifact: "rstack-observer-linux",
  },
];

// ─── locate pkg ───────────────────────────────────────────────────────────────
function findPkg() {
  // 1. local node_modules/.bin/pkg
  const local = path.join(ROOT, "node_modules", ".bin", "pkg");
  if (existsSync(local)) return local;

  // 2. global pkg on PATH
  try {
    const which = spawnSync(process.platform === "win32" ? "where" : "which", ["pkg"], {
      encoding: "utf8",
    });
    if (which.status === 0 && which.stdout.trim()) return "pkg";
  } catch {
    /* ignore */
  }

  return null;
}

// ─── banner ───────────────────────────────────────────────────────────────────
console.log(`
╔══════════════════════════════════════════════════════════╗
║           RStack Observer  —  Binary Builder             ║
╚══════════════════════════════════════════════════════════╝
`);

// ─── preflight ────────────────────────────────────────────────────────────────
if (!existsSync(ENTRY)) {
  console.error(`✗  Entry point not found: ${ENTRY}`);
  process.exit(1);
}

if (!existsSync(DIST)) {
  mkdirSync(DIST, { recursive: true });
  console.log(`   Created dist/ directory`);
}

const pkgBin = findPkg();
if (!pkgBin) {
  console.error(`
✗  pkg is not installed.

   Install it with:
     npm install --save-dev pkg

   Then re-run:
     node scripts/build-observer.js
`);
  process.exit(1);
}

console.log(`   pkg:   ${pkgBin}`);
console.log(`   entry: ${ENTRY}`);
console.log(`   dist:  ${DIST}`);
console.log();

// ─── build ────────────────────────────────────────────────────────────────────
let built = 0;
let failed = 0;

for (const target of TARGETS) {
  if (!target.flag) continue;

  process.stdout.write(`   Building ${target.name.padEnd(8)} → ${target.artifact} … `);

  const result = spawnSync(
    pkgBin,
    [
      ENTRY,
      "--target", target.pkgTarget,
      "--output", target.output,
      "--compress", "GZip",
    ],
    {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
    }
  );

  if (result.status === 0) {
    // Get file size
    let size = "";
    try {
      const { statSync } = await import("node:fs");
      const stat = statSync(target.output);
      size = ` (${(stat.size / 1_048_576).toFixed(1)} MB)`;
    } catch {
      /* ignore */
    }
    console.log(`✓${size}`);
    built++;
  } else {
    console.log("✗  FAILED");
    if (result.stderr) {
      console.error(result.stderr.trim().split("\n").map(l => `      ${l}`).join("\n"));
    }
    failed++;
  }
}

// ─── summary ──────────────────────────────────────────────────────────────────
console.log();
if (built > 0) {
  console.log(`✓  ${built} binary/binaries written to dist/`);
  console.log();
  console.log("   DISTRIBUTION:");
  console.log("   • Windows users: double-click rstack-observer-win.exe");
  console.log("   • macOS users:   chmod +x rstack-observer-macos && ./rstack-observer-macos");
  console.log("   • Linux users:   chmod +x rstack-observer-linux  && ./rstack-observer-linux");
  console.log();
  console.log("   All binaries open http://localhost:3007 in the default browser automatically.");
}

if (failed > 0) {
  console.error(`✗  ${failed} build(s) failed — see errors above`);
  process.exit(1);
}
