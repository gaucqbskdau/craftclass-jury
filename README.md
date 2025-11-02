# CraftClass Jury - FHEVM-Based Craft Competition Platform

A decentralized craft competition platform built with Fully Homomorphic Encryption (FHE) using FHEVM. This project enables private, encrypted scoring of craft works while maintaining transparency in the final results.

## Features

- **Encrypted Scoring**: Judges submit encrypted scores using FHEVM, ensuring privacy during the evaluation process
- **Homomorphic Aggregation**: Scores are aggregated on-chain without decryption, preserving privacy
- **Group Management**: Organize works into groups for competitive evaluation
- **Award System**: Publish final results with tier-based awards (Gold, Silver, Bronze)
- **Admin Dashboard**: Manage groups, works, and publish awards
- **Public Results**: Transparent display of final competition results

## Project Structure

```
.
├── fhevm-hardhat-template/    # Smart contracts and Hardhat configuration
│   ├── contracts/             # Solidity contracts (FHECraftJury.sol)
│   ├── deploy/                # Deployment scripts
│   ├── test/                  # Contract tests
│   └── tasks/                 # Hardhat custom tasks
│
└── craftclass-jury-frontend/  # Next.js frontend application
    ├── app/                   # Next.js App Router pages
    ├── components/            # React components
    ├── hooks/                 # Custom React hooks
    ├── fhevm/                 # FHEVM integration utilities
    └── abi/                   # Contract ABIs and addresses
```

## Technology Stack

- **Smart Contracts**: Solidity 0.8.27 with FHEVM 0.9.1
- **Frontend**: Next.js 15, React 19, TypeScript
- **Blockchain**: Ethereum (Sepolia Testnet)
- **Encryption**: FHEVM (Fully Homomorphic Encryption Virtual Machine)
- **Wallet**: MetaMask (EIP-1193, EIP-6963)

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- MetaMask browser extension
- Hardhat node (for local development)

### Contract Setup

```bash
cd fhevm-hardhat-template
npm install

# Set environment variables
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY
npx hardhat vars set ETHERSCAN_API_KEY

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to local network
npx hardhat node
npx hardhat deploy --network localhost

# Deploy to Sepolia
npx hardhat deploy --network sepolia
```

### Frontend Setup

```bash
cd craftclass-jury-frontend
npm install

# Generate ABI files (required before running)
node scripts/genabi.mjs

# Run in mock mode (for local Hardhat node)
npm run dev:mock

# Run in production mode (for Sepolia)
npm run dev

# Build for production
npm run build
```

## Deployment

The frontend is deployed on Vercel:
- Production: https://64488a15d46f87a1285fa0ec.vercel.app

## Contract Addresses

### Sepolia Testnet
- **FHECraftJury**: `0xa6C795606442C374bFebf7450cA14EB56606975E`

## How It Works

1. **Work Registration**: Admin registers craft works and organizes them into groups
2. **Encrypted Scoring**: Judges submit encrypted scores (Craftsmanship, Detail, Originality) using FHEVM
3. **Homomorphic Aggregation**: Admin aggregates scores on-chain without decryption
4. **Decryption & Publishing**: Admin decrypts final scores and publishes awards
5. **Public Results**: Final results are displayed publicly with tier-based awards

## Security Features

- **Role-Based Access Control**: Admin-only functions for critical operations
- **Encrypted Data**: All scores are encrypted using FHEVM
- **On-Chain Aggregation**: Transparent aggregation process
- **Decryption Authorization**: EIP-712 signatures for decryption permissions

## Development

### Running Tests

```bash
# Contract tests
cd fhevm-hardhat-template
npx hardhat test

# Frontend static check
cd craftclass-jury-frontend
npm run check:static
```

### Building

```bash
# Frontend production build
cd craftclass-jury-frontend
npm run build
```

## License

This project is licensed under the BSD-3-Clause-Clear License.

## Support

For issues and questions:
- FHEVM Documentation: https://docs.zama.ai/fhevm
- FHEVM Hardhat Guide: https://docs.zama.ai/protocol/solidity-guides/getting-started/setup


