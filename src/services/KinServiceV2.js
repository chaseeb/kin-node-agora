const sdk = require('@kinecosystem/kin-sdk-v2');
const dotenv = require('dotenv').config();
const CronJob = require('cron').CronJob;
const axios = require('axios');
const bs58 = require('bs58');

//initialize the Client with the environment, appIndex, whitlist secret key or any other configurations you wish you use
const client = new sdk.Client(sdk.Environment.Prod, {
    appIndex: process.env.appIndex,
    whitelistKey: sdk.PrivateKey.fromString(process.env.prodPrivate),
    kinVersion: 4,
    retryConfig: {maxRetries: 10, maxNonceRefreshes: 10}
  });

  async function createAccount() { 

    const privateKey = sdk.PrivateKey.random();
    const result = await client.createAccount(privateKey);

    return({public:privateKey.publicKey().stellarAddress(), private:privateKey.stellarSeed()});

}

//get transaction data using the transaction hash
async function getTransaction(txId) { 

    const txHash = Buffer.from(txId, "hex");
    console.log('Getting Transaction....');
    let transactionData = await client.getTransaction(txHash);

    console.log('Sender: ' + transactionData.payments[0].sender.toBase58());
    console.log('Destination: ' + transactionData.payments[0].destination.toBase58());
    console.log('Amount: ' + sdk.quarksToKin(transactionData.payments[0].quarks));

    return {SENDER: transactionData.payments[0].sender.toBase58(), DEST: transactionData.payments[0].destination.toBase58(), AMOUNT: sdk.quarksToKin(transactionData.payments[0].quarks)};

}

//get balance of account using the public key 
async function getBalance(publicAddress) { 

    const publicKey = sdk.PublicKey.fromString(publicAddress);
    const balance = await client.getBalance(publicKey);
    let kinTokenAccount = await client.resolveTokenAccounts(publicKey);

    console.log('Solana Account Address: ' + publicKey.toBase58());
    console.log('Kin Token Account: ' + kinTokenAccount[0].toBase58());
  
    // const response = await axios.get('https://www.coinbase.com/api/v2/assets/prices/238e025c-6b39-57ca-91d2-4ee7912cb518?base=USD');
    // const kinPrice = response.data.data.prices.latest;

    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=kin&vs_currencies=usd');
    const kinPrice = response.data.kin.usd;

    const usdBalance = sdk.quarksToKin(balance) * kinPrice;
  
    return {KIN_PRICE: kinPrice, KIN_BALANCE: parseInt(sdk.quarksToKin(balance)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),  USD_BALANCE: '$' + parseInt(usdBalance).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), DATE: new Date()};

}

async function getUsdValue(publicAddress) { 

    const balance = getBalance(publicAddress);
    const kinPrice = getKinPrice();
    const usdBalance = sdk.quarksToKin(balance) * kinPrice;
    return {balance: usdBalance}

}

async function getSolanaAddress(publicAddress) { 

    const publicKey = sdk.PublicKey.fromString(publicAddress);
    return {solanaAddress: publicKey.toBase58()};

}

async function getKinTokenAccount(publicAddress) { 

    const publicKey = sdk.PublicKey.fromString(publicAddress);
    const kinTokenAccount = await client.resolveTokenAccounts(publicKey);
    return {kinTokenAccount: kinTokenAccount};

}

async function getKinTokenAccountUrl(publicAddress) { 
    const kinTokenAccount = getKinTokenAccount(publicAddress)[0].toBase58();
    return {kinTokenAccountUrl: 'https://explorer.solana.com/address/' + kinTokenAccount + '/tokens?display=detail'};
}

async function getAccountInfo() { 

}

async function getKinRank() { 

}

async function getKinPrice() { 

    // const response = await axios.get('https://www.coinbase.com/api/v2/assets/prices/238e025c-6b39-57ca-91d2-4ee7912cb518?base=USD');
    // const kinPrice = response.data.data.prices.latest;
    
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=kin&vs_currencies=usd');
    const kinPrice = response.data.kin.usd;
}

async function getKinInfo() { 
    //kin rank
    //kin price
    //other stuff?
}

//send kin with using the senders private key and receivers public key
async function sendKin(senderPrivate, destPublic, amount) { 

    const sender = sdk.PrivateKey.fromString(senderPrivate);
    const dest = sdk.PublicKey.fromString(destPublic);

    console.log('start submit')

    let txHash = await client.submitPayment({
        sender: sender,
        destination: dest,
        quarks: sdk.kinToQuarks(amount),
        type: sdk.TransactionType.Spend
    });

    // let txHash = await client.submitPayment({
    //     sender: sender,
    //     destination: dest,
    //     quarks: sdk.kinToQuarks(amount),
    //     type: sdk.TransactionType.Spend
    // }, sdk.Commitment.Single, sdk.AccountResolution.Preferred, sdk.AccountResolution.Exact);

    console.log('Send Kin Success:');
    console.log(bs58.encode(txHash));

    return bs58.encode(txHash);

}

async function earnEvent() { 

}

//Cron Job?
async function payRandom() { 

}

// module.exports = {
//     createAccount,
//     getTransaction,
//     getBalance,
//     sendKin,
//     earnEvent,
//     getAccountInfo
// }
