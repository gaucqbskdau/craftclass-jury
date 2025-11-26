#!/usr/bin/env node

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const ethers = require("ethers");

async function checkHardhatNode() {
  try {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const network = await provider.getNetwork();
    
    if (network.chainId === 31337n) {
      console.log("✓ Hardhat node is running (chainId: 31337)");
      return true;
    } else {
      console.error(`✗ Node at localhost:8545 has unexpected chainId: ${network.chainId}`);
      process.exit(1);
    }
  } catch (error) {
    console.error("✗ Hardhat node is not running at http://127.0.0.1:8545");
    console.error("  Please start it with: cd ../fhevm-hardhat-template && npx hardhat node");
    process.exit(1);
  }
}

checkHardhatNode();

