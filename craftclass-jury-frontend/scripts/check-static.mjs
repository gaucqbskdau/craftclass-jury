#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const APP_DIR = join(__dirname, "..", "app");
const PAGES_DIR = join(__dirname, "..", "pages");

let errors = 0;

const FORBIDDEN_PATTERNS = [
  { pattern: /getServerSideProps/, message: "getServerSideProps is not allowed (SSR)" },
  { pattern: /export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/, message: "dynamic='force-dynamic' is not allowed" },
  { pattern: /from\s+['"]next\/headers['"]/, message: "next/headers is not allowed (server-only)" },
  { pattern: /\bcookies\(\)/, message: "cookies() is not allowed (server-only)" },
  { pattern: /\bheaders\(\)/, message: "headers() is not allowed (server-only)" },
  { pattern: /from\s+['"]server-only['"]/, message: "server-only imports are not allowed" },
  { pattern: /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)/, message: "Route handlers are not allowed" },
];

function checkFile(filePath) {
  if (!filePath.endsWith(".ts") && !filePath.endsWith(".tsx") && !filePath.endsWith(".js") && !filePath.endsWith(".jsx")) {
    return;
  }

  try {
    const content = readFileSync(filePath, "utf8");

    for (const { pattern, message } of FORBIDDEN_PATTERNS) {
      if (pattern.test(content)) {
        console.error(`✗ ${filePath}: ${message}`);
        errors++;
      }
    }
  } catch (err) {
    // Ignore read errors
  }
}

function checkDirectory(dirPath) {
  try {
    const entries = readdirSync(dirPath);

    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Check for dynamic routes
        if (entry.startsWith("[") && entry.endsWith("]")) {
          // Check if generateStaticParams exists
          const hasGenerateStaticParams = entries.some((e) => {
            const filePath = join(dirPath, e);
            if (!statSync(filePath).isFile()) return false;
            if (!e.endsWith(".ts") && !e.endsWith(".tsx") && !e.endsWith(".js") && !e.endsWith(".jsx")) return false;
            const content = readFileSync(filePath, "utf8");
            return /export\s+(async\s+)?function\s+generateStaticParams/.test(content);
          });

          if (!hasGenerateStaticParams) {
            console.error(`✗ ${fullPath}: Dynamic route without generateStaticParams`);
            errors++;
          }
        }

        checkDirectory(fullPath);
      } else if (stat.isFile()) {
        checkFile(fullPath);
      }
    }
  } catch (err) {
    // Ignore if directory doesn't exist
  }
}

console.log("Checking for static export violations...\n");

// Check app directory
if (statSync(APP_DIR, { throwIfNoEntry: false })) {
  checkDirectory(APP_DIR);
}

// Check pages directory (if exists)
if (statSync(PAGES_DIR, { throwIfNoEntry: false })) {
  checkDirectory(PAGES_DIR);
}

// Check for /api routes
const apiDir = join(APP_DIR, "api");
if (statSync(apiDir, { throwIfNoEntry: false })) {
  console.error(`✗ ${apiDir}: API routes are not allowed in static export`);
  errors++;
}

const pagesApiDir = join(PAGES_DIR, "api");
if (statSync(pagesApiDir, { throwIfNoEntry: false })) {
  console.error(`✗ ${pagesApiDir}: API routes are not allowed in static export`);
  errors++;
}

console.log();
if (errors > 0) {
  console.error(`✗ Found ${errors} static export violation(s)\n`);
  process.exit(1);
} else {
  console.log("✓ No static export violations found\n");
  process.exit(0);
}

