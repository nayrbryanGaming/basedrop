<div align="center">

# 💧 BaseDrop

### Crypto Payments via Shareable Links

[![Built on Base](https://img.shields.io/badge/Built%20on-Base-0052FF?style=for-the-badge&logo=coinbase&logoColor=white)](https://base.org)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?style=for-the-badge&logo=solidity&logoColor=white)](https://soliditylang.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://basedrop-protocol.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Open Source](https://img.shields.io/badge/Open%20Source-%E2%9D%A4-red?style=for-the-badge)](https://github.com/nayrbryanGaming/basedrop)

**[🌐 Live Demo](https://basedrop-protocol.vercel.app) · [📜 Smart Contract](https://sepolia.basescan.org/address/0x59C16998dFc090642EFFdc485c81adAc64d3ef91) · [🎥 Demo Video](https://youtu.be/Bt_tXOCMZfo)**

</div>

---

BaseDrop is an **open-source Web3 payment protocol** that lets users send cryptocurrency using a simple shareable link — no wallet address required on the recipient side.

Instead of copying long hex addresses and worrying about network compatibility, a sender locks funds in an on-chain escrow, generates a payment link, shares it anywhere, and the recipient claims the funds in one click.

**Built on Base. Focused on simplicity, security, and real on-chain settlement.**

---

## 🌍 Vision

Crypto payments should be as easy as sending a message.

The biggest UX barrier in Web3 today is the wallet address. BaseDrop removes it entirely.

Instead of this:

```
0x8a1e6F3B9c2D4A0E5f7C1B8D3E2A4F6C9D1E3B5F
```

Users simply share a link:

```
https://basedrop-protocol.vercel.app/claim/abc123
```

The recipient opens the link, connects any wallet, and claims the funds.

**No address copying. No network confusion. No friction.**

---

## ⚡ Key Features

### 🔗 Shareable Payment Links

Lock crypto in escrow and generate a unique claimable link in seconds.

```
https://basedrop-protocol.vercel.app/claim/<payment-id>
```

Share it anywhere:

- WhatsApp, Telegram, Discord
- Email or SMS
- QR code
- Social media

### 🔒 Non-Custodial Escrow

Funds are locked inside an audited on-chain escrow contract until claimed or cancelled.

- Trustless payments — no intermediary holds your funds
- Sender can cancel any unclaimed payment and recover funds at any time
- Immutable settlement — no server can redirect or block a claim

### ⚡ One-Click Claim

Recipients simply:

1. Open the payment link
2. Connect their wallet
3. Claim the funds

No wallet address exchange. No account creation.

### 💰 Multi-Token Support

| Token | Network | Decimals |
|---|---|---|
| ETH (native) | Base Sepolia | 18 |
| USDC | Base Sepolia | 6 |

### 🌐 Fully On-Chain Settlement

All fund transfers happen on **Base** — low fees, fast confirmations, transparent on-chain verification.

---

## 🏗️ Architecture

BaseDrop uses a hybrid architecture combining on-chain settlement with off-chain indexing.

```
User
  │
  ▼
Frontend (Next.js 16 — App Router)
  │
  ▼
API Layer (Next.js Route Handlers + Neon PostgreSQL)
  │
  ├──► Escrow Smart Contract (Base Sepolia)
  │
  └──► Database (Neon PostgreSQL — serverless)
```

### Payment Flow

```
Sender connects wallet
        │
        ▼
Select token (ETH / USDC) + amount + optional expiry
        │
        ▼
Funds locked in on-chain Escrow contract
        │
        ▼
Unique payment link generated
        │
        ▼
Sender shares link (chat, email, QR code)
        │
        ▼
Recipient opens link + connects wallet
        │
        ▼
Recipient claims → contract releases funds directly to wallet
```

Sender can cancel any unclaimed payment at any time to recover funds.

---

## ⛓️ Smart Contract

The `Escrow.sol` contract is deployed on **Base Sepolia** and handles all fund custody and settlement.

**Contract Address**

```
0x59C16998dFc090642EFFdc485c81adAc64d3ef91
```

[View on Basescan →](https://sepolia.basescan.org/address/0x59C16998dFc090642EFFdc485c81adAc64d3ef91)

**Core Interface**

```solidity
// Lock funds and create a payment
function createPayment(
    bytes32 paymentId,
    address token,
    uint256 amount,
    uint256 expiry
) external payable;

// Recipient claims — releases funds to their wallet
function claimPayment(bytes32 paymentId, address receiver) external;

// Sender cancels and recovers funds
function cancelPayment(bytes32 paymentId) external;
```

**Security Properties**

- `ReentrancyGuard` on all state-changing functions
- Only the original sender can cancel a payment
- `claimPayment()` can only be executed once per payment ID
- On-chain expiry enforced at the contract level
- ERC-20 transfer success verified before state change
- No admin key — no one can drain or redirect escrowed funds
- Built with OpenZeppelin v5 contracts as base

---

## 🌐 Live Product

**[https://basedrop-protocol.vercel.app](https://basedrop-protocol.vercel.app)**

Demo flow:

1. Connect wallet (MetaMask, Coinbase Wallet, WalletConnect, Porto)
2. Select token and enter amount
3. Create payment — funds locked on-chain
4. Copy the generated link or scan QR code
5. Share the link with recipient
6. Recipient opens link, connects wallet, claims funds

---

## 🎥 Demo

[Watch the demo video →](https://youtu.be/Bt_tXOCMZfo)

---

## 💻 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16.1.6 (App Router) · React 19 · TypeScript |
| **Styling** | Tailwind CSS 4 · Framer Motion · Lucide React |
| **Web3** | wagmi v3 · viem v2 · RainbowKit v2 |
| **Wallets** | MetaMask · Coinbase Wallet · WalletConnect · Porto |
| **Smart Contracts** | Solidity ^0.8.20 · Hardhat · OpenZeppelin v5 |
| **Database** | Neon PostgreSQL (serverless) |
| **Infrastructure** | Vercel · GitHub |
| **Network** | Base Sepolia (Chain ID: 84532) |

---

## 📦 Project Structure

```
basedrop/
│
├── app/
│   ├── page.tsx                          # Create payment page
│   ├── layout.tsx                        # Global layout + metadata
│   ├── providers.tsx                     # wagmi + RainbowKit providers
│   ├── globals.css
│   ├── constants/
│   │   └── contract.ts                   # ABI + contract + token addresses
│   ├── api/
│   │   ├── payments/
│   │   │   ├── route.ts                  # POST /api/payments
│   │   │   └── [paymentId]/
│   │   │       ├── route.ts              # GET  /api/payments/:id
│   │   │       ├── cancel/route.ts       # POST /api/payments/:id/cancel
│   │   │       └── claim/route.ts        # POST /api/payments/:id/claim
│   │   └── users/
│   │       └── [wallet]/
│   │           └── payments/route.ts     # GET  /api/users/:wallet/payments
│   └── claim/
│       └── [paymentId]/
│           └── page.tsx                  # Recipient claim page
│
├── contracts/
│   ├── contracts/
│   │   └── Escrow.sol                    # Core escrow contract
│   ├── scripts/
│   │   └── deploy.js                     # Hardhat deploy script
│   └── hardhat.config.js
│
├── scripts/
│   ├── check_balance.js
│   └── verify_contract.js
│
├── SUPABASE_SETUP.sql                    # Database schema
├── package.json
├── next.config.ts
├── vercel.json
└── README.md
```

---

## ⚙️ Environment Variables

Create a `.env.local` file in the project root:

```env
# Database (Neon PostgreSQL)
POSTGRES_URL=your_neon_connection_string

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Contract (optional — defaults to deployed address)
NEXT_PUBLIC_ESCROW_ADDRESS=0x59C16998dFc090642EFFdc485c81adAc64d3ef91
```

| Variable | Required | Description |
|---|---|---|
| `POSTGRES_URL` | ✅ | Neon PostgreSQL connection string |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | ✅ | WalletConnect Cloud project ID |
| `NEXT_PUBLIC_ESCROW_ADDRESS` | Optional | Override the escrow contract address |

---

## 🛠️ Local Development

**1. Clone the repository**

```bash
git clone https://github.com/nayrbryanGaming/basedrop.git
cd basedrop
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment**

```bash
cp .env.example .env.local
# Fill in your environment variables
```

**4. Initialize the database**

```bash
psql $POSTGRES_URL -f SUPABASE_SETUP.sql
```

**5. Start the development server**

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

Deploy `Escrow.sol` to Base Sepolia:

```bash
cd contracts
npm install
npx hardhat run scripts/deploy.js --network baseSepolia
```

Update `NEXT_PUBLIC_ESCROW_ADDRESS` in your environment with the deployed address.

---

## 🚀 Deployment

BaseDrop is optimized for deployment on Vercel.

1. Push repository to GitHub
2. Import project at [vercel.com/new](https://vercel.com/new)
3. Configure the three environment variables
4. Deploy

---

## 🔐 Security Design

Security is a core design priority.

- **Non-custodial** — the application server never touches user funds
- **Escrow model** — all funds are held by the on-chain contract, not a wallet controlled by us
- **Reentrancy protection** — `ReentrancyGuard` on every state-changing function
- **Access control** — only the original sender can cancel; claim can only execute once
- **Expiry enforcement** — enforced at the contract level, not the application layer
- **Verified ERC-20 transfers** — transfer success confirmed before state is updated
- **No admin keys** — no privileged role can drain, redirect, or freeze escrow funds

---

## 🎯 Use Cases

| Use Case | Description |
|---|---|
| **Freelance Payments** | Pay contractors instantly without exchanging wallet addresses |
| **Creator Tipping** | Accept crypto tips via a shareable link |
| **Community Rewards** | Distribute rewards across Discord, Telegram, or X |
| **Gift Crypto** | Send crypto as a gift link — recipient claims when ready |
| **Invoice Settlement** | Replace manual invoice + transfer flow with a single link |

---

## 🗺️ Roadmap

| Phase | Status | Milestone |
|---|---|---|
| Phase 1 | ✅ Complete | `Escrow.sol` deployed on Base Sepolia |
| Phase 2 | ✅ Complete | Full API layer (create, claim, cancel, history) |
| Phase 3 | ✅ Complete | Frontend — create page + claim page |
| Phase 4 | ✅ Complete | ETH + USDC multi-token support |
| Phase 5 | ✅ Complete | Live wallet balance display with MAX button |
| Phase 6 | 🔜 Planned | Payment link analytics dashboard |
| Phase 7 | 🔜 Planned | Batch payment creation |
| Phase 8 | 🔜 Planned | Link expiration controls (UI) |
| Phase 9 | 🔜 Planned | Base Mainnet deployment |
| Phase 10 | 🔜 Planned | Developer SDK + Payment API |

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: description"`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a pull request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) format.

---

## 🌎 Open Source

BaseDrop is fully open source under the MIT License.

**[github.com/nayrbryanGaming/basedrop](https://github.com/nayrbryanGaming/basedrop)**

---

## 👨‍💻 Founder

**Vincentius Bryan Kwandou**

Web3 developer focused on blockchain infrastructure and crypto payment systems.

[LinkedIn →](https://linkedin.com/in/bryankwandou)

---

## 📄 License

[MIT License](LICENSE) — open source and free to use.

---

## 🔗 Links

| | |
|---|---|
| **Live App** | [basedrop-protocol.vercel.app](https://basedrop-protocol.vercel.app) |
| **Smart Contract** | [View on Basescan](https://sepolia.basescan.org/address/0x59C16998dFc090642EFFdc485c81adAc64d3ef91) |
| **Demo Video** | [Watch on YouTube](https://youtu.be/Bt_tXOCMZfo) |
| **GitHub** | [nayrbryanGaming/basedrop](https://github.com/nayrbryanGaming/basedrop) |
| **Founder** | [linkedin.com/in/bryankwandou](https://linkedin.com/in/bryankwandou) |

---

<div align="center">

**⭐ If you find this project useful, star the repository.**

*Crypto payments should not be complicated.*
*BaseDrop proves that sending crypto can be as simple as sharing a link.*

[![Built on Base](https://img.shields.io/badge/Built%20on-Base-0052FF?style=flat-square&logo=coinbase&logoColor=white)](https://base.org)

</div>
