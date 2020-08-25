const express = require('express');
const app = express();

const Client = require("@kinecosystem/kin-sdk-v2").Client;
const Environment = require("@kinecosystem/kin-sdk-v2").Environment;
const PrivateKey = require("@kinecosystem/kin-sdk-v2").PrivateKey;
const PublicKey = require("@kinecosystem/kin-sdk-v2").PublicKey;
const kinToQuarks = require("@kinecosystem/kin-sdk-v2").kinToQuarks;

const c = new Client(Environment.Prod);

async function createAccount() { 

    try{
        const privateKey = PrivateKey.random();
        const result = await c.createAccount(privateKey);
        console.log(privateKey.publicKey().stellarAddress());
    }
    catch(e){
        console.log(e);
    }

}

async function getTransaction() { 

    try{
        const txHash = Buffer.from("TX HASH HERE", "hex");
        const transactionData = await c.getTransaction(txHash);

        console.log(transactionData);
    }
    catch(e){
        console.log(e);
    }   

}

async function getBalance() { 

    try{
        const publicKey = PublicKey.fromString('PUBLIC ADDRESS HERE');
        const balance = await c.getBalance(publicKey);

        console.log(balance.toNumber());
    }
    catch(e){
        console.log(e);
    }   

}

async function sendKin() { 

    try{
        const sender = PrivateKey.fromString('PRIVATE KEY OF SENDER HERE');
        const dest = PublicKey.fromString('PUBLIC KEY OF RECEIVER HERE');

        let txHash = await c.submitPayment({
            sender: sender,
            destination: dest,
            quarks: kinToQuarks("1")
        });

        console.log(txHash.toString('hex'));

        sendBatchKin();

    }
    catch (e){
        console.log(e);
    }
}

async function sendBatchKin() { 

    const sender = PrivateKey.fromString('PRIVATE KEY OF DEVELOPER ACCOUNT HERE');

    const earns = [
        {
            destination: PublicKey.fromString("PUBLIC KEY OF RECEIVER HERE"),
            quarks: kinToQuarks("1"),
        },
        {
            destination: PublicKey.fromString("PUBLIC KEY OF RECEIVER HERE"),
            quarks: kinToQuarks("1"),
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