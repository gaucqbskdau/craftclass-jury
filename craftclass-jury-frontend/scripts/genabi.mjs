#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONTRACT_NAME = "FHECraftJury";
const HARDHAT_DEPLOYMENTS_PATH = "../fhevm-hardhat-template/deployments";
const OUTPUT_DIR = join(__dirname, "..", "abi");

function generateABI() {
  console.log("Generating ABI files...");

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Read localhost deployment
  const localhostPath = join(__dirname, "..", HARDHAT_DEPLOYMENTS_PATH, "localhost", `${CONTRACT_NAME}.json`);
  
  if (!existsSync(localhostPath)) {
    console.warn(`⚠ Warning: ${CONTRACT_NAME}.json not found in localhost deployments`);
    console.warn("  Run: cd ../fhevm-hardhat-template && npx hardhat node --network localhost");
    console.warn("  Then: npx hardhat deploy --network localhost");
    
    // Create empty placeholder files
    writeFileSync(
      join(OUTPUT_DIR, `${CONTRACT_NAME}ABI.ts`),
      `export const ${CONTRACT_NAME}ABI = [] as const;\n`
    );
    writeFileSync(
      join(OUTPUT_DIR, `${CONTRACT_NAME}Addresses.ts`),
      `export const ${CONTRACT_NAME}Addresses: Record<number, string> = {};\n`
    );
    console.log("✓ Created placeholder ABI files");
    return;
  }

  const localhostDeployment = JSON.parse(readFileSync(localhostPath, "utf8"));

  // Generate ABI file
  const abiContent = `// Auto-generated from deployments
export const ${CONTRACT_NAME}ABI = ${JSON.stringify(localhostDeployment.abi, null, 2)} as const;
`;

  writeFileSync(join(OUTPUT_DIR, `${CONTRACT_NAME}ABI.ts`), abiContent);
  console.log(`✓ Generated ${CONTRACT_NAME}ABI.ts`);

  // Generate Addresses file
  const addresses = {
    31337: localhostDeployment.address, // localhost
  };

  // Try to read Sepolia deployment if it exists
  const sepoliaPath = join(__dirname, "..", HARDHAT_DEPLOYMENTS_PATH, "sepolia", `${CONTRACT_NAME}.json`);
  if (existsSync(sepoliaPath)) {
    const sepoliaDeployment = JSON.parse(readFileSync(sepoliaPath, "utf8"));
    addresses[11155111] = sepoliaDeployment.address;
    console.log(`✓ Found Sepolia deployment at ${sepoliaDeployment.address}`);
  }

  const addressContent = `// Auto-generated from deployments
export const ${CONTRACT_NAME}Addresses: Record<number, string> = ${JSON.stringify(addresses, null, 2)};
`;

  writeFileSync(join(OUTPUT_DIR, `${CONTRACT_NAME}Addresses.ts`), addressContent);
  console.log(`✓ Generated ${CONTRACT_NAME}Addresses.ts`);

  console.log("✓ ABI generation complete");
}

generateABI();

