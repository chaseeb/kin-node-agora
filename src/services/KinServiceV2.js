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

  /**
  * Create Account
  * @return {JSON}      Keypair of newly created wallet
  */
  async function createAccount() { 

    const privateKey = sdk.PrivateKey.random();
    await client.createAccount(privateKey);

    let createdAccount = {};
    createdAccount.public = privateKey.publicKey().stellarAddress();
    createdAccount.private = privateKey.stellarSeed();

    return createdAccount;

}

//get transaction data using the transaction hash
async function getTransaction(txId) { 

    const txHash = Buffer.from(txId, "hex");

    let result = await client.getTransaction(txHash);

    let transactionData = {};
    transactionData.sender = result.payments[0].sender.toBase58();
    transactionData.destination = result.payments[0].destination.toBase58();
    transactionData.amount = sdk.quarksToKin(result.payments[0].quarks);

    return transactionData;

}

//get balance of account using the public key 
async function getBalance(publicAddress) { 

    const publicKey = sdk.PublicKey.fromString(publicAddress);

    let balance = await client.getBalance(publicKey);
    balance = sdk.quarksToKin(balance);
    //balance = parseInt(sdk.quarksToKin(balance)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  
    return balance;

}

async function getUsdValue(publicAddress) { 

    const balance = await getBalance(publicAddress);
    const kinPrice = await getKinPrice();
    let usdBalance = balance * kinPrice;
    //usdBalance = parseInt(usdBalance).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
    return usdBalance.toFixed(2);

}

async function getSolanaAddress(publicAddress) { 

    const publicKey = sdk.PublicKey.fromString(publicAddress);
    const solanaAddress = publicKey.toBase58();

    return solanaAddress;
}

async function getKinTokenAccount(publicAddress) { 

    const publicKey = sdk.PublicKey.fromString(publicAddress);
    kinTokenAccount = await client.resolveTokenAccounts(publicKey);
    kinTokenAccount = kinTokenAccount[0].toBase58();

    return kinTokenAccount;

}

async function getKinTokenAccountUrl(publicAddress) { 

    const kinTokenAccount = await getKinTokenAccount(publicAddress);
    return 'https://explorer.solana.com/address/' + kinTokenAccount + '/tokens?display=detail';

}

async function getAccountInfo(publicAddress) { 

    let accountInfo = {};

    //Todo:? for loop to simplify this?

    accountInfo.kinBalance = await getBalance(publicAddress);
    accountInfo.usdValue = await getUsdValue(publicAddress);
    accountInfo.stellarAddress = publicAddress;
    accountInfo.solanaAddress = await getSolanaAddress(publicAddress);
    accountInfo.kinTokenAccount = await getKinTokenAccount(publicAddress);
    accountInfo.kinTokenAccountUrl = await getKinTokenAccountUrl(publicAddress);
    accountInfo.date = new Date();
    accountInfo.apiDonationAddress = '2ufa5fC6vu9NrfgYjtQEbSMhfbL3oE4JoMvsKfYeXnsh';

    return accountInfo;

}

async function getKinRank() { 

    return 1;

}

async function getKinPrice() { 

    // const response = await axios.get('https://www.coinbase.com/api/v2/assets/prices/238e025c-6b39-57ca-91d2-4ee7912cb518?base=USD');
    // const kinPrice = response.data.data.prices.latest;
    
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=kin&vs_currencies=usd');
    const kinPrice = response.data.kin.usd;

    return kinPrice;
}

async function getKinMarketCap() { 

    //TODO: CoinMarketCap API

    return '100 Million';

}

async function getKinCircSupply() { 

    //TODO: Get Wallets

    return '1.5 Trillion';

}

async function getKinTotalSupply() { 

    //TODO: Add to controller

    return '1.5 Trillion';

}

async function getKinInfo() { 
    
    //make sure all of these are added to controller

    let kinInfo = {};
    kinInfo.rank = await getKinRank();
    kinInfo.price = await getKinPrice();
    kinInfo.getKinMarketCap = await getKinMarketCap()
    kinInfo.circulatingSupply = await getKinCircSupply();
    kinInfo.totalSupply = await getKinTotalSupply();
    kinInfo.apiDonationAddress = '2ufa5fC6vu9NrfgYjtQEbSMhfbL3oE4JoMvsKfYeXnsh';

    console.log(kinInfo);

    return kinInfo;
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

    //TODO: Use Kin Service V1

}

//Cron Job?
async function payRandom() { 

}

module.exports = {
    createAccount,
    getTransaction,
    getBalance,
    getUsdValue,
    getSolanaAddress,
    getKinTokenAccount,
    getKinTokenAccountUrl,
    getAccountInfo,
    getKinRank,
    getKinPrice,
    getKinMarketCap,
    getKinCircSupply,
    getKinInfo,
    sendKin,
    earnEvent,
    payRandom
}
