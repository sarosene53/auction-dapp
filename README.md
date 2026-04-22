# Unique Bid Auction DApp

A decentralized auction platform built on Ethereum where the **highest unique bid** wins. This DApp utilizes a secure **commit-reveal scheme** to prevent bid sniping, front-running, and ensure a fair auction process.

## 🌟 Overview

Traditional auctions can suffer from last-minute bid sniping or front-running by miners/bots on the blockchain. The Unique Bid Auction DApp solves this by separating the bidding process into two distinct phases:

1. **Commit Phase**: Bidders submit a cryptographic hash of their bid amount and a secret password along with an ETH deposit. No one can see the actual bid amount.
2. **Reveal Phase**: Bidders reveal their secret password and actual bid amount. The smart contract verifies this against the previously submitted hash.

Once the reveal phase ends, the auction is settled. The winner is the bidder with the highest bid amount that **no one else submitted**. The winner pays their bid, and all other participants receive a full refund of their deposits.

## 🏗 Architecture

The project is structured as a monorepo containing three main components:

- **`/smart-contracts`**: The core Solidity contracts, deployed using Hardhat.
- **`/backend`**: A Node.js service that indexes blockchain events (e.g., `AuctionCreated`, `BidCommitted`, `BidRevealed`) and provides a fast API for the frontend.
- **`/frontend`**: A modern React application built with Vite and styled with TailwindCSS, allowing users to interact with the auctions and their Web3 wallets seamlessly.

## ✨ Features

- **Commit-Reveal Mechanism**: Cryptographically secure bidding.
- **Fair Settlement**: Highest unique bid algorithm ensures strategic gameplay and fairness.
- **Automated Refunds**: Losers are automatically refunded their deposits in a single transaction upon settlement.
- **Real-Time Indexing**: Backend indexer tracks events to provide a snappy, responsive UI without relying solely on slow RPC calls.
- **Modern UI/UX**: Built with React, Vite, and TailwindCSS for a responsive and intuitive user experience.

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [MetaMask](https://metamask.io/) or another Web3 wallet

### 1. Smart Contracts

Navigate to the smart contracts directory, install dependencies, and start a local Hardhat node:

```bash
cd smart-contracts
npm install
npx hardhat node
```

In a new terminal, deploy the contracts to the local network:

```bash
cd smart-contracts
npx hardhat run scripts/deploy.js --network localhost
```

*Note: Copy the deployed contract address for the frontend and backend configuration.*

### 2. Backend API & Indexer

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

Create a `.env` file based on your local setup (e.g., RPC URL, Contract Address) and start the server:

```bash
node server.js
```

### 3. Frontend Application

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

Create a `.env` file with the necessary environment variables (e.g., API URL, Contract Address) and start the development server:

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser to interact with the DApp!

## 🔐 Security

- **Re-entrancy Protection**: State changes (like clearing deposits) are made before transferring funds.
- **Hash Verification**: Bids are verified using `keccak256(abi.encodePacked(_amount, _secret))`.
- **Deposit Constraints**: Bidders must deposit an amount greater than or equal to their intended bid to prevent spam and under-collateralized bids.

## 📄 License

This project is licensed under the MIT License.
