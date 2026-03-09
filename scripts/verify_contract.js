
const { createPublicClient, http } = require('viem');
const { baseSepolia } = require('viem/chains');

const ESCROW_ADDRESS = "0x90A31465706E4CedE24e534CaA7148353A499651";
const ESCROW_ABI = [
    {
        "inputs": [],
        "name": "owner",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    }
];

async function verify() {
    const client = createPublicClient({
        chain: baseSepolia,
        transport: http()
    });

    try {
        const owner = await client.readContract({
            address: ESCROW_ADDRESS,
            abi: ESCROW_ABI,
            functionName: 'owner'
        });
        console.log('CONTRACT_VERIFIED: Success!');
        console.log('Contract Owner:', owner);
    } catch (e) {
        console.error('CONTRACT_VERIFIED: Failed!');
        console.error(e.message);
    }
}

verify();
