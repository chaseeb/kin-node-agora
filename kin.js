const sdk = require('@kinecosystem/kin-sdk-v2');
const webhook = require('@kinecosystem/kin-sdk-v2/dist/webhook');
const dotenv = require('dotenv').config();

//initialize the Client with the environment, appIndex or any other configurations you wish you use
const client = new sdk.Client(sdk.Environment.Prod, {
    appIndex: process.env.appIndex
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
async function getTransaction(tx) { 

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
async function getBalance(userPublic) { 

    try{
        const publicKey = sdk.PublicKey.fromString(userPublic);
        const balance = await client.getBalance(publicKey);

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
            quarks: sdk.kinToQuarks(amount)
        });

        console.log(txHash.toString('hex'));
        return txHash.toString('hex');
    }
    catch (e){
        console.log(e);
    }
}

//send multiple earn payments with Agora in a single transaction 
async function sendBatchKin(senderPrivate, payments) { 

    const sender = sdk.PrivateKey.fromString(senderPrivate);
    const earns = [
        {
            destination: sdk.PublicKey.fromString(payments[0].publicKey),
            quarks: sdk.kinToQuarks(payments[0].amount),
        },
        {
            destination: sdk.PublicKey.fromString(payments[1].publicKey),
            quarks: sdk.kinToQuarks(payment[1].amount),
        }
    ];

    try{
        const result = await client.submitEarnBatch({
            sender: sender,
            earns: earns,
        })

        console.log(result.succeeded[0].txHash.toString('hex'));
        return result.succeeded[0].txHash.toString('hex');
    }
    catch (e){
        console.log(e);
    }
}

async function signTransaction(req, resp) { 

    console.log('signTransaction function')

    return webhook.SignTransactionHandler(Environment.Prod, (req, resp) => {

        console.log(req, res);

    });

}

module.exports = {
    createAccount,
    getTransaction,
    getBalance,
    sendKin,
    sendBatchKin,
    signTransaction
}