const { createPublicClient, http } = require('viem');
const { baseSepolia } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');

async function checkBalance() {
    const privateKey = '0x3ed7524b66da7ebedb2618692bdbf46ca3342b0aa931a1f79f7758ab651ecb41';
    const account = privateKeyToAccount(privateKey);
    console.log('Wallet Address:', account.address);

    const client = createPublicClient({
        chain: baseSepolia,
        transport: http()
    });

    const balance = await client.getBalance({ address: account.address });
    console.log('Balance:', balance.toString(), 'wei');
    console.log('ETH:', (Number(balance) / 1e18).toFixed(4));
}

checkBalance().catch(console.error);
