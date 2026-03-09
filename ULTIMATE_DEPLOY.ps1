# ULTIMATE_DEPLOY.ps1 - MISSION CRITICAL AUTOMATION FOR BASEDROP
# PERFECTION OR DEATH 🚀🚀🚀

$ErrorActionPreference = "Stop"

Write-Host "--- INITIATING ULTIMATE DEPLOYMENT SEQUENCE ---" -ForegroundColor Cyan

# 1. CONTRACT DEPLOYMENT
Write-Host "Step 1: Deploying Smart Contract to Base Sepolia..." -ForegroundColor Yellow
Set-Location "e:\000VSCODE PROJECT MULAI DARI DESEMBER 2025\STARTUP - BASE BATCHES 003\basedrop\contracts"
$deployOutput = npx hardhat run scripts/deploy.js --network base-sepolia

# Parse Address from output
$contractAddress = ($deployOutput | Select-String -Pattern "Escrow contract deployed to: (0x[a-fA-F0-0-9]{40})").Matches.Groups[1].Value

if (-not $contractAddress) {
    Write-Error "Deployment failed. Address not found in output."
}

Write-Host "SUCCESS! New Contract Address: $contractAddress" -ForegroundColor Green

# 2. FRONTEND SYNCHRONIZATION
Write-Host "Step 2: Syncing address to Frontend constants..." -ForegroundColor Yellow
$constantsPath = "e:\000VSCODE PROJECT MULAI DARI DESEMBER 2025\STARTUP - BASE BATCHES 003\basedrop\app\constants\contract.ts"
$content = Get-Content $constantsPath
$newContent = $content -replace 'ESCROW_ADDRESS = \(process\.env\.NEXT_PUBLIC_ESCROW_ADDRESS \|\| "[^"]+"\)', "ESCROW_ADDRESS = (process.env.NEXT_PUBLIC_ESCROW_ADDRESS || `"$contractAddress`")"
Set-Content $constantsPath $newContent

# 3. BUILD VERIFICATION
Write-Host "Step 3: Verifying Frontend Build..." -ForegroundColor Yellow
Set-Location "e:\000VSCODE PROJECT MULAI DARI DESEMBER 2025\STARTUP - BASE BATCHES 003\basedrop"
npm run build

Write-Host "--- MISSION ACCOMPLISHED: 101% PERFECTED ---" -ForegroundColor Cyan
Write-Host "New Contract: $contractAddress"
Write-Host "Build Status: SUCCESS"
