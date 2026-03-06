# BaseDrop

Simple crypto payments using shareable links.

BaseDrop is an open-source Web3 payment link protocol built on the **Base network**.
It allows users to send cryptocurrency using a simple shareable link instead of complicated wallet addresses.

The receiver simply opens the link, connects a wallet, and claims the payment instantly.

---

# Problem

Sending crypto today is still complicated.

Users must:

* copy long wallet addresses
* ensure the correct network
* understand gas fees
* confirm complex transactions

For non-technical users this creates friction and mistakes.

Example wallet address:

```
0x8f3c5a3c4d9a2eab81d0...
```

Many users send funds to the wrong address or wrong chain.

---

# Solution

BaseDrop removes this friction by replacing wallet addresses with **simple payment links**.

Instead of sending crypto directly to a wallet address, users generate a payment link.

Example:

```
https://basedrop.app/claim/abc123
```

Anyone with the link can claim the payment by connecting a wallet.

---

# How It Works

### Step 1 — Sender connects wallet

The sender connects their wallet to BaseDrop.

Supported wallets include:

* Coinbase Wallet
* MetaMask
* WalletConnect compatible wallets

---

### Step 2 — Sender creates payment

The sender inputs an amount and generates a payment link.

Example:

```
Amount: 5 USDC
```

The funds are deposited into a smart contract escrow.

---

### Step 3 — Link is generated

BaseDrop generates a unique payment link.

Example:

```
basedrop.app/claim/payment123
```

The sender can share this link via:

* WhatsApp
* Telegram
* Discord
* Email
* Social media

---

### Step 4 — Receiver claims payment

The receiver opens the link.

Steps:

1. Connect wallet
2. Click **Claim Payment**
3. Receive funds instantly

The smart contract releases the funds to the receiver wallet.

---

# Why BaseDrop

BaseDrop makes crypto payments:

* simple
* fast
* user-friendly
* accessible for non-crypto users

By leveraging the **Base network**, transactions benefit from:

* low fees
* fast confirmation
* Ethereum security

---

# Features

Current MVP features:

* Wallet connection
* Payment link generation
* Smart contract escrow
* Claimable payment links
* On-chain settlement
* Simple UI for payments

Future features:

* QR code payment links
* Gasless transactions
* Payment expiration
* Password protected links
* Multi-token support
* Mobile-first UI

---

# Tech Stack

Frontend

* Next.js
* TypeScript
* Tailwind CSS
* wagmi
* RainbowKit

Backend

* Node.js
* Express

Blockchain

* Base Network
* Solidity smart contracts
* ethers.js

Infrastructure

* Vercel (frontend deployment)
* GitHub (source code hosting)

---

# Architecture

High-level architecture:

```
User
 ↓
Frontend (Next.js)
 ↓
Wallet Connection
 ↓
Smart Contract Escrow
 ↓
Base Network
```

Payment flow:

```
Sender
 ↓
Deposit funds
 ↓
Create payment link
 ↓
Receiver opens link
 ↓
Claim payment
```

---

# Smart Contract Overview

The escrow contract manages payment deposits and claims.

Core functions:

```
createPayment(paymentId, token, amount)
claimPayment(paymentId)
cancelPayment(paymentId)
```

Security checks:

* prevent double claims
* validate sender ownership
* track payment status
* emit events for each transaction

---

# Repository Structure

```
basedrop
 ├ frontend
 │  ├ pages
 │  ├ components
 │  ├ hooks
 │
 ├ backend
 │  ├ routes
 │  ├ controllers
 │
 ├ contracts
 │  ├ Escrow.sol
 │
 ├ scripts
 │
 └ README.md
```

---

# Local Development

Clone the repository:

```
git clone https://github.com/nayrbryanGaming/basedrop.git
```

Enter project folder:

```
cd basedrop
```

Install dependencies:

```
npm install
```

Run development server:

```
npm run dev
```

Open browser:

```
http://localhost:3000
```

---

# Deploying the Frontend

The frontend can be deployed using **Vercel**.

Steps:

1. Push repository to GitHub
2. Import project into Vercel
3. Deploy automatically

Vercel will generate a URL like:

```
https://basedrop.vercel.app
```

---

# Deploying Smart Contracts

Smart contracts can be deployed using:

* Hardhat
* Foundry

Target network:

```
Base Sepolia (testnet)
```

Deployment process:

1. compile contracts
2. deploy escrow contract
3. verify contract
4. connect frontend

### Contract Address (Base Sepolia)
`0x5721864424BC13F0281F8C2995Fd28D87Db80904`

---

# Security Considerations

Important security rules:

* prevent double payment claims
* validate payment status
* avoid reentrancy attacks
* validate token addresses
* use OpenZeppelin libraries

All smart contracts should be audited before production deployment.

---

# Roadmap

Phase 1 — MVP

* payment link generation
* escrow smart contract
* claim functionality

Phase 2 — UX improvements

* QR code links
* mobile optimization
* payment analytics

Phase 3 — ecosystem integration

* developer SDK
* API integration
* merchant tools

---

# Use Cases

BaseDrop can be used for:

* peer-to-peer payments
* tipping creators
* community rewards
* micro-payments
* event payments
* social payments

---

# Contributing

We welcome contributions from the community.

Steps:

1. fork repository
2. create feature branch
3. submit pull request

Please follow coding standards and security guidelines.

---

# License

MIT License.

This project is open-source and free to use.

---

# Vision

Our mission is to make **crypto payments as simple as sending a link**.

BaseDrop aims to reduce friction in Web3 and bring blockchain payments closer to mainstream adoption.
