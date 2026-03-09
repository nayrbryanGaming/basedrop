# BaseDrop: 101% Perfected Crypto Links on Base 🚀⚖️

BaseDrop is a world-class Web3 application designed to make cryptocurrency payments as effortless as sending a link. Built for the **Base Batches 003** program, it ensures zero-tolerance for errors, absolute security, and a premium user experience.

## 🌟 Mission
To eliminate the friction of wallet addresses. Lock your funds, share a link, and let the recipient claim with a single click.

## 🏗️ Core Architecture (Rescue 9.0 Certified)
- **Escrow-Based Safety**: Funds are held in a secure, audited smart contract on Base Sepolia.
- **Zero-Tolerance API**: Overhauled with isolated `BigInt` cleaning and robust environment diagnostics for absolute Vercel stability.
- **Synchronization Lockdown**: Aggressive retry logic for backend persistence and real-time on-chain verification.
- **Premium UX Tier**: High-fidelity interface using `Outfit` typography, Framer Motion animations, and custom mesh gradients.

## 🚀 Deployment Guide

### 1. Smart Contract
The `Escrow.sol` contract is live and verified on **Base Sepolia**:
- **Verified Address**: `0x4a7C27ddcAa3095a82466aA89B7fbD512Ace1a82`
- **Explorer**: [View on BaseScan](https://sepolia.basescan.org/address/0x4a7C27ddcAa3095a82466aA89B7fbD512Ace1a82)

### 2. Vercel Environment Variables
For a successful deployment, you **MUST** configure the following variables in your Vercel Project Settings:

| Variable | Importance | Description |
| :--- | :--- | :--- |
| `SUPABASE_URL` | **CRITICAL** | Your Supabase Project URL |
| `SUPABASE_ANON_KEY` | **CRITICAL** | Your Supabase Anon Key |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | **REQUIRED** | Your WalletConnect Dashboard Project ID |
| `NEXT_PUBLIC_ESCROW_ADDRESS` | **SYNCED** | `0x4a7C27ddcAa3095a82466aA89B7fbD512Ace1a82` |

### 3. Database Initialization
Run the provided `SUPABASE_SETUP.sql` in your Supabase SQL Editor to prepare the high-performance `payments` table.

## 🛠️ Development & Tooling
- **Deployment Script**: Use `./ULTIMATE_DEPLOY.ps1` for automated constant synchronization.
- **Diagnostic Scripts**: `node scripts/verify_contract.js` to audit the live contract state.
- **Protocols**: Standardized `safeResponse` pattern in all API routes.

## 📦 Tech Stack
- **Frontend**: Next.js 16 (Turbopack), Tailwind 4, Framer Motion
- **Web3 Engine**: Viem & Wagmi (Core Stack), RainbowKit
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (Edge Runtime Optimized)

---
**⚖️ 101% Perfected by Antigravity Architect**
*Created with Zero-Tolerance for the Base Batches Program.*
