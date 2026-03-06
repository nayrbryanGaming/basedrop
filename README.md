# BaseDrop

BaseDrop is a Web3 application on the Base network that allows users to send crypto via shareable payment links.

## Project Structure

- `/frontend`: Next.js application (Wagmi + RainbowKit).
- `/backend`: Node.js Express server (Supabase).
- `/contracts`: Hardhat smart contracts (Escrow).

## Setup

### 1. Smart Contract
- `contracts/hardhat.config.js`: Add your `PRIVATE_KEY`.
- `npx hardhat compile`
- `npx hardhat run scripts/deploy.js --network base-sepolia`

### 2. Backend
- Create a Supabase project.
- Run the SQL in `backend/setup_supabase.sql`.
- Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to `backend/.env`.
- `npm install`
- `npm start`

### 3. Frontend
- Add `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` to `frontend/.env.local`.
- `npm install`
- `npm run dev`

## Deployment

### Vercel
- Import the repository to Vercel.
- The root directory is `frontend`.
- For the backend, you can deploy it as a separate Vercel project or host it on a service like Railway/Render.
- Ensure all environment variables are set in Vercel.

## Contract Address (Base Sepolia)
`0x939aE9D5E8B18266F500B7185F63f701DdD5`
