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

  async function createAccount() { 

    const privateKey = sdk.PrivateKey.random();
    await client.createAccount(privateKey);

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

    console.log('{transactionData}', transactionData);

    return transactionData;

}

//get balance of account using the public key 
async function getBalance(publicAddress) { 

    const publicKey = sdk.PublicKey.fromString(publicAddress);

    let balance = await client.getBalance(publicKey);
    balance = sdk.quarksToKin(balance);
    //balance = parseInt(sdk.quarksToKin(balance)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    console.log('{balance}', balance);
  
    return balance;

}

async function getUsdValue(publicAddress) { 

    const balance = await getBalance(publicAddress);
    const kinPrice = await getKinPrice();
    let usdBalance = balance * kinPrice;
    //usdBalance = parseInt(usdBalance).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
    console.log('{usdValue}', usdBalance.toFixed(2));
    
    return usdBalance.toFixed(2);

}

async function getSolanaAddress(publicAddress) { 

    const publicKey = sdk.PublicKey.fromString(publicAddress);
    const solanaAddress = publicKey.toBase58();

    console.log('{solanaAddress}', solanaAddress);

    return solanaAddress;
}

async function getKinTokenAccount(publicAddress) { 

    const publicKey = sdk.PublicKey.fromString(publicAddress);
    kinTokenAccount = await client.resolveTokenAccounts(publicKey);
    kinTokenAccount = kinTokenAccount[0].toBase58();

    console.log('{kinTokenAccount}', kinTokenAccount);

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
    accountInfo.stellarAddress = publicAddress;
    accountInfo.solanaAddress = await getSolanaAddress(publicAddress);
    accountInfo.kinTokenAccount = await getKinTokenAccount(publicAddress);
    accountInfo.kinTokenAccountUrl = await getKinTokenAccountUrl(publicAddress);
    accountInfo.date = new Date();
    //accountInfo.apiDonationAddress = '2ufa5fC6vu9NrfgYjtQEbSMhfbL3oE4JoMvsKfYeXnsh';

    console.log('account info', accountInfo);

    return accountInfo;

}

async function getKinPrice() { 

    // const response = await axios.get('https://www.coinbase.com/api/v2/assets/prices/238e025c-6b39-57ca-91d2-4ee7912cb518?base=USD');
    // const kinPrice = response.data.data.prices.latest;
    
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=kin&vs_currencies=usd');
    const kinPrice = response.data.kin.usd;

    console.log('{kinPice}', kinPrice);

    return kinPrice;
}

async function getKinMarketCap() { 

    //TODO: CoinMarketCap API

    let circSupply = await getKinCircSupply();
    let kinPrice = await getKinPrice();
    let marketCap = circSupply * kinPrice;

    console.log('{marketCap}', marketCap);

    return marketCap;

}

async function getKinCircSupply() { 

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
    
        console.log(circSupply);
    
        return circSupply;

}

async function getKinTotalSupply() { 

    //TODO: Add to controller

    console.log('{totalSupply}', '10,000,000,000,000');

    return 10000000000000;

}

async function getKinInfo() { 
    
    //make sure all of these are added to controller

    let kinInfo = {};
    kinInfo.price = await getKinPrice();
    kinInfo.circulatingSupply = await getKinCircSupply();
    kinInfo.marketCap = await getKinMarketCap();
    kinInfo.totalSupply = await getKinTotalSupply();
    kinInfo.date = new Date();
    //kinInfo.apiDonationAddress = '2ufa5fC6vu9NrfgYjtQEbSMhfbL3oE4JoMvsKfYeXnsh';

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

    //if b58decode false, use this

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

    let earn = {};

    earn.destination = sdk.PublicKey.fromString(dest);
    earn.quarks = sdk.kinToQuarks(amount);
    earn.type = sdk.TransactionType.Earn;

        try{
            console.log('Submitting Earn Batch:');
            console.log(new Date());
            const result = await client.submitEarnBatch({
                sender: sender,
                earns: [earn]
                //memo: 'buy the ticket, take the ride'
            });
            console.log('Earn Batch Successful');
            console.log(new Date());

            console.log(bs58.encode(result.txId));

            if(result.txError){
                console.log(result.txError);
                //console.log(result.earnErrors)
                return result.txErrors;
            }

            // if(result.earnErrors){
            //     console.log(result.earnErrors);
            // }

        }
        catch (e){
            console.log('Earn Batch Error: ' + e);
            return 500;
        }
    
    return 200;
    
}

// var job = new CronJob('*/10 * * * * *', async function() {

//     console.log('pay random');
//     //pay random address

// }, null, true, 'America/Los_Angeles');
// job.start();

module.exports = {
    createAccount,
    getTransaction,
    getBalance,
    getUsdValue,
    getSolanaAddress,
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
