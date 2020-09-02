const sdk = require('@kinecosystem/kin-sdk-v2');
const dotenv = require('dotenv').config();
var CronJob = require('cron').CronJob;

//initialize the Client with the environment, appIndex or any other configurations you wish you use
const client = new sdk.Client(sdk.Environment.Prod, {
    appIndex: process.env.appIndex,
    whitelistKey: sdk.PrivateKey.fromString(process.env.prodPrivate)
  });

//generate new random private key and submit to Agora for account creation
async function createAccount() { 

    try{
        const privateKey = sdk.PrivateKey.random();
        const result = await client.createAccount(privateKey);

        console.log(privateKey.publicKey().stellarAddress());
        return(privateKey.publicKey().stellarAddress());
    }
    catch(e){
        console.log(e);
    }

}

//get transaction data from Agora using the transaction hash
async function getTransaction(txId) { 

    try{
        const txHash = Buffer.from(tx, "hex");
        const transactionData = await client.getTransaction(txHash);

        console.log(transactionData);
        return transactionData;
    }
    catch(e){
        console.log(e);
    }   

}

//get balance of account from Agora using the public key 
async function getBalance(publicAddress) { 

    try{
        const publicKey = sdk.PublicKey.fromString(userPublic);
        const balance = await client.getBalance(publicAddress);

        console.log(balance.toNumber());
        return balance.toNumber();
    }
    catch(e){
        console.log(e);
    }   

}

//send kin with Agora using the senders private key and receivers public key
async function sendKin(senderPrivate, destPublic, amount) { 

    try{
        const sender = sdk.PrivateKey.fromString(senderPrivate);
        const dest = sdk.PublicKey.fromString(destPublic);

        let txHash = await client.submitPayment({
            sender: sender,
            destination: dest,
            quarks: sdk.kinToQuarks(amount),
            type: sdk.TransactionType.Spend
        });

        console.log(txHash.toString('hex'));
        return txHash.toString('hex');
    }
    catch (e){
        console.log(e);
    }
}

let earns = [];
async function addToEarnQueue(dest, amount) { 

    earns.push(        
        {
            destination: sdk.PublicKey.fromString(dest),
            quarks: sdk.kinToQuarks(amount),
            type: sdk.TransactionType.Earn
        }
    )

    return(200);
    
}

var CronJob = require('cron').CronJob;
var job = new CronJob('*/10 * * * * *', async function() {
    const sender = sdk.PrivateKey.fromString(process.env.prodPrivate);

    const earnList = earns;
    earns = [];

    if(earnList.length > 0){
        try{
            const result = await client.submitEarnBatch({
                sender: sender,
                earns: earnList
            });
    
            console.log(result.succeeded[0].txHash.toString('hex'));
            return result.succeeded[0].txHash.toString('hex');
        }
        catch (e){
            console.log(e);
        }
    }

}, null, true, 'America/Los_Angeles');
job.start();

module.exports = {
    createAccount,
    getTransaction,
    getBalance,
    sendKin,
    addToEarnQueue
}