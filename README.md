# 💧 BaseDrop Protocol

### Decentralized Payment Link Infrastructure on Base

BaseDrop is an open protocol that enables **anyone to lock crypto funds in a smart contract escrow and share a claimable payment link** — no wallet address required on the recipient side.

The protocol introduces a new primitive called **Pay-Per-Link**, allowing any sender to create a one-time claimable payment that any recipient can claim with a single click from any wallet.

BaseDrop eliminates the friction of wallet addresses, replacing them with **shareable links secured by on-chain escrow.**

---

## 🌍 Vision

Sending crypto today still requires knowing the recipient's wallet address.

This creates friction:

❌ recipients must share sensitive wallet addresses  
❌ senders must copy-paste long hex strings  
❌ no way to send crypto to someone who may not have a wallet yet  
❌ no expiry, no cancellation, no safety net  

They rely on centralized transfer systems.

BaseDrop introduces the missing infrastructure layer.

A decentralized payment coordination protocol where **funds are locked on-chain and released to whoever holds the link.**

---

## ⚡ Core Concept

BaseDrop introduces **Pay-Per-Link.**

Instead of sending crypto directly to an address, senders lock funds in an escrow contract and generate a unique payment link.

Example use cases:

* send a payment to a freelancer before they have a wallet
* gift crypto via a shareable link
* pay a contractor with a cancellable escrow
* distribute rewards with optional expiry
* request payment from a client via link

Each payment is represented as an **on-chain escrow record.**

A unique link is generated.

The recipient opens the link, connects any wallet, and claims.

Once claimed, the contract releases funds directly to the recipient's wallet.

---

## 🧠 The Payment Flow

```
Sender connects wallet
        ↓
Select token (ETH or USDC) + amount + optional expiry
        ↓
Funds locked in Escrow smart contract
        ↓
Unique payment link generated
        ↓
Sender shares link (any channel: chat, email, QR code)
        ↓
Recipient opens link + connects wallet
        ↓
Recipient claims → contract releases funds
```

Sender can cancel any unclaimed payment at any time to recover funds.

---

## ⚙️ System Architecture

BaseDrop consists of four primary layers.

```
Frontend (Next.js)
        ↓
API Layer (Next.js Route Handlers + Neon DB)
        ↓
Smart Contract Layer (Escrow.sol on Base Sepolia)
        ↓
Wallet Layer (wagmi + RainbowKit + viem)
```

Each layer plays a distinct role.

---

## 🧩 Architecture Overview

### 1. Smart Contract Layer

`Escrow.sol` is responsible for:

* locking sender funds on payment creation
* holding funds until claimed or cancelled
* releasing funds directly to the recipient's wallet
* enforcing optional on-chain expiry

Core functions:

```solidity
createPayment(bytes32 paymentId, address token, uint256 amount, uint256 expiry)
claimPayment(bytes32 paymentId, address receiver)
cancelPayment(bytes32 paymentId)
```

Supported assets:

* **ETH** — native, no approval needed
* **USDC** — ERC-20, requires approval before lock

Contract is deployed on **Base Sepolia** at:

```
0x59C16998dFc090642EFFdc485c81adAc64d3ef91
```

[View on Basescan →](https://sepolia.basescan.org/address/0x59C16998dFc090642EFFdc485c81adAc64d3ef91)

Workflow:

1. Sender calls `createPayment()` — funds locked in contract.
2. Contract emits `PaymentCreated` event.
3. API records the payment in the database.
4. Recipient opens claim link and connects wallet.
5. API calls `claimPayment()` — funds released to recipient.
6. Sender can call `cancelPayment()` to recover unclaimed funds.

---

### 2. API Layer

Next.js Route Handlers act as the bridge between frontend and both the database and smart contract.

Responsibilities:

* validate and record new payment metadata
* serve payment details to the claim page
* handle claim and cancel coordination
* return user payment history by wallet address

Routes:

```
POST   /api/payments                        → create payment record
GET    /api/payments/[paymentId]            → fetch payment details
POST   /api/payments/[paymentId]/claim      → mark payment as claimed
POST   /api/payments/[paymentId]/cancel     → mark payment as cancelled
GET    /api/users/[wallet]/payments         → list payments by wallet
```

Database: **Neon PostgreSQL** (serverless, Singapore region).

---

### 3. Frontend

The Next.js frontend provides two core pages.

**Create Page (`/`)**

Users can:

* connect wallet (MetaMask, Coinbase Wallet, WalletConnect, and more)
* select token (ETH or USDC) and amount
* see live wallet balance with MAX button and insufficient balance warning
* set optional payment expiry date
* generate a payment link after on-chain confirmation
* copy or share the link via QR code

**Claim Page (`/claim/[paymentId]`)**

Recipients can:

* view payment details (amount, token, sender, expiry)
* connect any wallet to claim
* receive funds directly to their connected wallet in one click

---

### 4. Wallet Layer

Wallet integration is built on the wagmi + RainbowKit + viem stack.

Supported wallets:

* MetaMask
* Coinbase Wallet
* WalletConnect (300+ wallets)
* Porto

Chain enforcement: the UI automatically prompts users to switch to Base Sepolia if connected to the wrong network.

---

## 🛠️ Technology Stack

| Layer | Stack |
|---|---|
| Frontend | Next.js 16.1.6 (App Router) · React 19 · TypeScript |
| Styling | Tailwind CSS 4 · Framer Motion · Lucide React |
| Wallet | wagmi v3 · viem v2 · RainbowKit v2 |
| Smart Contracts | Solidity ^0.8.20 · Hardhat · OpenZeppelin |
| Database | Neon PostgreSQL (serverless) |
| Infrastructure | Vercel · GitHub |

---

## 📦 Repository Structure

```
basedrop/
│
├── app/
│   ├── page.tsx                          ← Create payment page
│   ├── layout.tsx
│   ├── providers.tsx
│   ├── globals.css
│   ├── constants/
│   │   └── contract.ts                   ← ABI + contract addresses
│   ├── api/
│   │   ├── payments/
│   │   │   ├── route.ts                  ← POST create payment
│   │   │   └── [paymentId]/
│   │   │       ├── route.ts              ← GET payment details
│   │   │       ├── cancel/route.ts       ← POST cancel
│   │   │       └── claim/route.ts        ← POST claim
│   │   └── users/
│   │       └── [wallet]/
│   │           └── payments/route.ts     ← GET payment history
│   └── claim/
│       └── [paymentId]/
│           └── page.tsx                  ← Claim payment page
│
├── contracts/
│   ├── contracts/
│   │   └── Escrow.sol
│   ├── scripts/
│   │   └── deploy.js
│   └── hardhat.config.js
│
├── scripts/
│   ├── check_balance.js
│   └── verify_contract.js
│
└── README.md
```

---

## 🚀 Installation

Clone the repository.

```bash
git clone https://github.com/nayrbryangaming/basedrop
cd basedrop
```

Install frontend dependencies.

```bash
npm install
```

Install contract dependencies.

```bash
cd contracts
npm install
```

---

## ⚙️ Environment Configuration

Create a `.env.local` file in the project root.

```env
# Database
POSTGRES_URL=your_neon_connection_string

# Wallet Connect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Contract (optional override)
NEXT_PUBLIC_ESCROW_ADDRESS=0x59C16998dFc090642EFFdc485c81adAc64d3ef91
```

| Variable | Description |
|---|---|
| `POSTGRES_URL` | Neon PostgreSQL connection string |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect dashboard project ID |
| `NEXT_PUBLIC_ESCROW_ADDRESS` | Deployed `Escrow.sol` contract address |

---

## 🗄️ Database Initialization

Run the provided SQL against your Neon database.

```bash
psql $POSTGRES_URL -f SUPABASE_SETUP.sql
```

This creates the `payments` table used by all API routes.

---

## 🖥️ Development

Start the development server.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🏗️ Build

```bash
npm run build
```

---

## 📡 Smart Contract Deployment

Deploy `Escrow.sol` to Base Sepolia.

```bash
cd contracts
npx hardhat run scripts/deploy.js --network baseSepolia
```

Update `NEXT_PUBLIC_ESCROW_ADDRESS` in your environment with the deployed address.

---

## 🔄 End-to-End Payment Flow

1. Sender connects wallet on [basedrop-protocol.vercel.app](https://basedrop-protocol.vercel.app).
2. Sender selects ETH or USDC, enters amount, optional expiry.
3. For USDC: approval transaction submitted first.
4. `createPayment()` called on-chain — funds locked.
5. API records the payment with a unique `paymentId`.
6. Frontend generates claim URL: `/claim/[paymentId]`.
7. Sender copies link or scans QR code and shares it.
8. Recipient opens link, connects any wallet, clicks Claim.
9. `claimPayment()` called on-chain — funds sent directly to recipient wallet.
10. Sender can cancel at any time before claim to recover funds.

---

## 🗺️ Roadmap

| Phase | Status | Milestone |
|---|---|---|
| Phase 1 | ✅ Complete | `Escrow.sol` deployed on Base Sepolia |
| Phase 2 | ✅ Complete | Full API layer (create, claim, cancel, history) |
| Phase 3 | ✅ Complete | Frontend create + claim pages |
| Phase 4 | ✅ Complete | ETH + USDC multi-token support |
| Phase 5 | ✅ Complete | Live wallet balance display + MAX button |
| Phase 6 | 🔜 Planned | Payment link QR code sharing |
| Phase 7 | 🔜 Planned | Batch payment creation |
| Phase 8 | 🔜 Planned | Base Mainnet deployment |

---

## 🔐 Security

BaseDrop is built with security-first principles.

* `ReentrancyGuard` on all state-changing contract functions
* Escrow design — funds never touch an intermediary
* Only the original sender can cancel a payment
* `claimPayment()` can only be called once per payment ID
* On-chain expiry enforcement at the contract level
* ERC-20 transfer success verified before state change
* No admin key can drain or redirect escrowed funds

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Commit your changes (`git commit -m "feat: description"`)
4. Push to the branch (`git push origin feat/your-feature`)
5. Open a pull request

Please follow conventional commit format.

---

## 📄 License

MIT License — open source and free to use.

---

## 🌐 Links

* **Live App** — [basedrop-protocol.vercel.app](https://basedrop-protocol.vercel.app)
* **Smart Contract** — [View on Basescan](https://sepolia.basescan.org/address/0x59C16998dFc090642EFFdc485c81adAc64d3ef91)
* **GitHub** — [nayrbryanGaming/basedrop](https://github.com/nayrbryanGaming/basedrop)

---

> *"No wallet address needed. Just a link."*
