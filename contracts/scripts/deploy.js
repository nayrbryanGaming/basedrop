const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const Escrow = await hre.ethers.getContractFactory("Escrow");
    const escrow = await Escrow.deploy();

    await escrow.waitForDeployment();

    console.log("Escrow contract deployed to:", await escrow.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
