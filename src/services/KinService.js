const sdk = require('@kinecosystem/kin-sdk-v2');
const dotenv = require('dotenv').config();
const CronJob = require('cron').CronJob;
const axios = require('axios');
const bs58 = require('bs58');
const { default: Logger } = require('js-logger');
const logger = require('js-logger');

//initialize the Client with the environment, appIndex, whitlist secret key or any other configurations you wish you use
const client = new sdk.Client(sdk.Environment.Prod, {
    appIndex: process.env.appIndex,
    whitelistKey: sdk.PrivateKey.fromString(process.env.prodPrivate),
    kinVersion: 4
  });

//generate new random private key
//use private key to create account
async function createAccount() { 

    const privateKey = sdk.PrivateKey.random();
    const result = await client.createAccount(privateKey);

    return({public:privateKey.publicKey().stellarAddress(), private:privateKey.stellarSeed()});

}

//get balance of account using the public key 
async function getBalance(publicAddress) { 

    const publicKey = sdk.PublicKey.fromString(publicAddress);
    const balance = await client.getBalance(publicKey);
    let kinTokenAccount = await client.resolveTokenAccounts(publicKey);

    console.log('Solana Account Address: ' + publicKey.toBase58());
    console.log('Kin Token Account: ' + kinTokenAccount[0].toBase58());
  
    const response = await axios.get('https://www.coinbase.com/api/v2/assets/prices/238e025c-6b39-57ca-91d2-4ee7912cb518?base=USD');
    const kinPrice = response.data.data.prices.latest;

    // const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=kin&vs_currencies=usd');
    // const kinPrice = response.data.kin.usd;

    const usdBalance = sdk.quarksToKin(balance) * kinPrice;
  
    return {KIN_PRICE: kinPrice, KIN_BALANCE: parseInt(sdk.quarksToKin(balance)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),  USD_BALANCE: '$' + parseInt(usdBalance).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), DATE: new Date()};

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
    return addToEarnQueue(dest, amount);

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

//earn queue (not meant for production, will not save state on server crash)
let earns = [];

//returns global earns (clojure?)
//can't keep using the global variable
//or maybe i can since it's only available to this js file?

// async function earns() { 



// }

// Add to earn Queue
async function addToEarnQueue(dest, amount) { 

    earns.push(        
        {
            destination: sdk.PublicKey.fromString(dest),
            quarks: sdk.kinToQuarks(amount),
            type: sdk.TransactionType.Earn
        }
    )

    return 200;
    
}

var job = new CronJob('*/10 * * * * *', async function() {

    const sender = sdk.PrivateKey.fromString(process.env.prodPrivate);

    const earnList = earns;
    earns = [];

    if(earnList.length > 0){
        try{

            console.log('Submitting Earn Batch:');
            console.log(new Date());
            const result = await client.submitEarnBatch({
                sender: sender,
                earns: earnList,
                memo: 'buy the ticket, take the ride'
            });
            console.log(new Date());

            console.log(bs58.encode(result.txId));

            if(result.txError){
                console.log(result.txError);
            }

            if(result.earnErrors){
                console.log(result.earnErrors);
            }

            // if(result.txError){
            //     console.log('Earn Batch Failed Tx:');

                // for (let r of result.failed) {

                //     let retryDest = r.earn.destination.stellarAddress();
                //     let retryAmount = sdk.quarksToKin(r.earn.quarks);

                //     console.log('adding to earn queue for retry');
                //     addToEarnQueue(retryDest, retryAmount);

                //     console.log(result.failed[0].error);

                    // if destination does not exist, don't add back to queue
                    ///if (result.failed[i].error){

                    // // if insuffienient balance, dev wallet needs refilled
                    // if(true){

                    // }

                // }

            // }
            // else{
                //console.log('Earn Batch Success: ' + result.txId.toString('hex'))
            // }
        }
        catch (e){
            console.log('Earn Batch Error: ' + e);
        }
    }

}, null, true, 'America/Los_Angeles');
job.start();

module.exports = {
    createAccount,
    getTransaction,
    getBalance,
    sendKin,
    earnEvent
}


//   async function massSend() { 

//     let list = ['']

//     for(let i of list){
//         earns.push(        
//             {
//                 destination: sdk.PublicKey.fromString(i),
//                 quarks: sdk.kinToQuarks(1),
//                 type: sdk.TransactionType.Earn
//             }
//         )
//     }

// }

// massSend();


//// Kin Jobs ///
// let availChannels = []
// //createChannels();

// async function createChannels() { 

//     for(let i = 0; i < 10; i++){
//         const privateKey = sdk.PrivateKey.random();
//         client.createAccount(privateKey);
//         availChannels.push(privateKey);
//     }
//     console.log('Channels Created');

// }

//pay kin to random wallets
//make people come to site/submit once per day to get engagement 
//once they start coming back find a way to monetize
// let payRandomKin = new CronJob('*/10 * * * * *', async function() {

//     try{


//     }
//     catch (e){

//     }

// }, null, true, 'America/Los_Angeles');
// payRandomKin.start();