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
    retryConfig: {maxRetries: 0}
  });

let kinDailyStartPrice;
let date = new Date();

async function init() { 

    kinDailyStartPrice = await getKinPrice();

    //set daily price
    //set current date
    //set other stuff

}

init();

async function createAccount() { 

    const privateKey = sdk.PrivateKey.random();
    let start = new Date();
    console.log('Creating Account');
    await client.createAccount(privateKey);
    let end = new Date();
    console.log("Account Created In " + (end - start) / 1000 + ' seconds');

    let createdAccount = {};

    createdAccount.stellarPublic = privateKey.publicKey().stellarAddress();
    createdAccount.stellarPrivate = privateKey.stellarSeed();
    createdAccount.solanaPublic = privateKey.publicKey().toBase58();
    createdAccount.solanaPrivate = privateKey.toBase58();

    console.log('{stellar.public}', createdAccount.stellarPublic);
    console.log('{stellar.private}', createdAccount.stellarPrivate);
    console.log('{solana.public}', createdAccount.solanaPublic);
    console.log('{solana.private}',  createdAccount.solanaPrivate);

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

async function getPublicKey(publicAddress) { 

    let publicKey;

    try{
        publicKey = sdk.PublicKey.fromBase58(publicAddress);
    }
    catch(e){
        console.log('not base 58')
    }

    if(publicKey == null){
        publicKey = sdk.PublicKey.fromString(publicAddress);
    }

    return publicKey;

}

//get balance of account using the public key 
async function getBalance(publicAddress) { 

    let publicKey = await getPublicKey(publicAddress);

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

async function getStellarAddress(publicAddress) { 

    const publicKey = await getPublicKey(publicAddress);
    const stellarAddress = publicKey.stellarAddress();

    return stellarAddress;
}

async function getKinTokenAccount(publicAddress) { 

    const publicKey = await getPublicKey(publicAddress);
    kinTokenAccount = await client.resolveTokenAccounts(publicKey);
    kinTokenAccount = kinTokenAccount[0].toBase58();

    return kinTokenAccount;

}

async function getKinTokenAccountUrl(publicAddress) { 

    const kinTokenAccount = await getKinTokenAccount(publicAddress);

    console.log('{kinTokenAccountUrl}', 'https://explorer.solana.com/address/' + kinTokenAccount + '/tokens?display=detail');

    return 'https://explorer.solana.com/address/' + kinTokenAccount + '/tokens?display=detail';

}

async function getAccountInfo(publicAddress) { 

    let accountInfo = {};

    //Todo:? for loop to simplify this?

    accountInfo.kinBalance = await getBalance(publicAddress);
    accountInfo.usdValue = await getUsdValue(publicAddress);
    accountInfo.price = await getKinPrice();
    accountInfo.stellarAddress = await getStellarAddress(publicAddress);
    accountInfo.kinTokenAccount = await getKinTokenAccount(publicAddress);
    accountInfo.kinTokenAccountUrl = await getKinTokenAccountUrl(publicAddress);
    accountInfo.date = new Date();

    console.log('account info', accountInfo);

    return accountInfo;

}

async function getKinPrice() { 

    // const response = await axios.get('https://www.coinbase.com/api/v2/assets/prices/238e025c-6b39-57ca-91d2-4ee7912cb518?base=USD');
    // const kinPrice = response.data.data.prices.latest;
    
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=kin&vs_currencies=usd');
    const kinPrice = response.data.kin.usd;

    return kinPrice;
}

async function get24HourChange() { 

    let kinPrice = await getKinPrice();

    let change = kinPrice - kinDailyStartPrice;
    let percentChange = (change / kinDailyStartPrice) * 100;

    return percentChange;

}

async function getKinMarketCap() { 

    //TODO: CoinMarketCap API

    let circSupply = await getKinCircSupply();
    let kinPrice = await getKinPrice();
    let marketCap = circSupply * kinPrice;

    return marketCap;

}

async function getKinCircSupply() { 

    //move to .env so this repo can be public
    const wallets = [
        'GCRHAQFQRKVXTDW6HELH6XLNENK2G2JLGUTRVZAWYTBWX5K3VJ75B6S5',
        'GD2YFOMTV424PS3XKOF7IRAPHK36K4I3PGE6JNXA3OYYQTTX5X5CO5JN',
        'GAJX4OVQRDJDNLIBWI3IBNEJU6QNGT3DZOOFMUV2Y7HTTZUDRGM6GU75']
      
        let totalWalletBalances = 0;
      
        for (let w of wallets) {
          let publicKey = sdk.PublicKey.fromString(w);
          let balance = await client.getBalance(publicKey);
        
          totalWalletBalances += parseInt(sdk.quarksToKin(balance));
        }
      
        let circSupply = 10000000000000 - totalWalletBalances;
    
        return circSupply;

}

async function getKinTotalSupply() { 

    return 10000000000000;

}

async function getKinInfo() { 
    
    //make sure all of these are added to controller

    let kinInfo = {};

    kinInfo.price = await getKinPrice();
    kinInfo.priceChange24Hour = await get24HourChange() + '%';
    kinInfo.circulatingSupply = await getKinCircSupply();
    kinInfo.marketCap = await getKinMarketCap();
    kinInfo.totalSupply = await getKinTotalSupply();
    kinInfo.date = new Date();

    console.log(kinInfo);

    return kinInfo;
}

//send kin with using the senders private key and receivers public key
//it is never recommended to end your private key over the internet
//this is meant as an example only
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

//Validate the earn event
//Add to queue if all checks pass
async function earnEvent(dest, amount) { 

    //test data
    let isMyUser = true;
    let validAmount = true;
    let validType = true;
    let earnLimitExceeded = false;

    //Do some checks to make sure this is legit user and transaction
    //These are just examples and should be specific to your app

    // if(dest != 'GBADWYSILXOIKF7N7QGHPGXP64SFGRZX7T53OMWPU2FUCOEDFF7QJZBL'){
    //     return 403;
    // }

    if(!isMyUser){
        // log user data, ip and return (for later evaluation of fraud)
        return 403;
    }

    if(!validAmount){
        // log user data, ip and return (for later evaluation of fraud)
        return 403;
    }

    if(!validType){
        // log user data, ip and return (for later evaluation of fraud)
        return 403;
    }

    if(earnLimitExceeded){
        return 403;
    }    

    //all checks passed, add to earn queue for processing
    return processEarn(dest, amount);

}

// Add to earn Queue
async function processEarn(dest, amount) { 

    const sender = sdk.PrivateKey.fromString(process.env.prodPrivate);

    let earns = [{}];

    earns[0].destination = await getPublicKey(dest);
    earns[0].quarks = sdk.kinToQuarks(amount);
    earns[0].type = sdk.TransactionType.Earn;

        try{
            console.log('Submitting Earn Batch');
            let start = new Date();
            const result = await client.submitEarnBatch({
                sender: sender,
                earns: earns
            });

            let end = new Date();
            console.log('Earn Batch Completed In ' + (end - start) / 1000 + ' seconds');

            console.log('Transaction ID: ' + bs58.encode(result.txId));

            //result{txid, txerror, earnerrors[{error, earnindex}]}

            if(result.txError){
                // console.log(result.txError);
                console.log(result);
                //console.log(result.earnErrors)
                return result.txError.name;
            }
            else{
                return bs58.encode(result.txId)
            }

        }
        catch (e){
            console.log('Earn Batch Error: ' + e);
            return 500;
        }
    
}

var job = new CronJob('*/10 * * * * *', async function() {

    console.log('Price Change 24 Hour: ' + await get24HourChange() + '%');

    if(date.toDateString() != new Date().toDateString()){
        date = new Date();
    }

}, null, true, 'America/Los_Angeles');
job.start();

module.exports = {
    createAccount,
    getTransaction,
    getBalance,
    getUsdValue,
    getKinTokenAccount,
    getKinTokenAccountUrl,
    getAccountInfo,
    getKinPrice,
    getKinMarketCap,
    getKinCircSupply,
    getKinTotalSupply,
    getKinInfo,
    sendKin,
    earnEvent
}
