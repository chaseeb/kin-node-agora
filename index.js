const express = require('express');
const app = express();
const sdk = require("@kinecosystem/kin-sdk-v2");

const c = new sdk.Client(sdk.Environment.Prod);

//generate new random private key and submit to Agora for account creation
async function createAccount() { 

    try{
        const privateKey = sdk.PrivateKey.random();
        const result = await c.createAccount(privateKey);
        console.log(privateKey.publicKey().stellarAddress());
    }
    catch(e){
        console.log(e);
    }

}

//get transaction data from Agora using the transaction hash
async function getTransaction() { 

    try{
        const txHash = Buffer.from("TX_HASH_HERE", "hex");
        const transactionData = await c.getTransaction(txHash);

        console.log(transactionData);
    }
    catch(e){
        console.log(e);
    }   

}

//get balance of account from Agora using the public key 
async function getBalance() { 

    try{
        const publicKey = sdk.PublicKey.fromString('PUBLIC_ADDRESS_HERE');
        const balance = await c.getBalance(publicKey);

        console.log(balance.toNumber());
    }
    catch(e){
        console.log(e);
    }   

}

//send kin with Agora using the senders private key and receivers public key
async function sendKin() { 

    try{

        const sender = sdk.PrivateKey.fromString('PRIVATE_KEY_OF_ENDER_HERE');
        const dest = sdk.PublicKey.fromString('PUBLIC_KEY_OF_RECEIVER_HERE');

        let txHash = await c.submitPayment({
            sender: sender,
            destination: dest,
            quarks: sdk.kinToQuarks("1")
        });

        console.log(txHash.toString('hex'));

    }
    catch (e){
        console.log(e);
    }
}

//send multiple earn payments with Agora in a single transaction 
async function sendBatchKin() { 

    const sender = sdk.PrivateKey.fromString('PRIVATE_KEY_OF_DEVELOPER_ACCOUNT_HERE');

    const earns = [
        {
            destination: sdk.PublicKey.fromString("PUBLIC_KEY_OF_RECEIVER_HERE"),
            quarks: sdk.kinToQuarks("1"),
        },
        {
            destination: sdk.PublicKey.fromString("PUBLIC KEY OF RECEIVER HERE"),
            quarks: sdk.kinToQuarks("1"),
        }
    ];

    try{

        const result = await c.submitEarnBatch({
            sender: sender,
            earns: earns,
        })

        console.log(result.succeeded[0].txHash.toString('hex'));

    }
    catch (e){
        console.log(e);
    }
}


const port = process.env.PORT || 3000;

const server = app.listen(port, function() {
  console.log('Express server listening on port ' + port);
});