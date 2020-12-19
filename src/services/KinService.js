const sdk = require('@kinecosystem/kin-sdk-v2');
const dotenv = require('dotenv').config();
const CronJob = require('cron').CronJob;

//initialize the Client with the environment, appIndex, whitlist secret key or any other configurations you wish you use
const client = new sdk.Client(sdk.Environment.Prod, {
    appIndex: process.env.appIndex,
    //whitelistKey: sdk.PrivateKey.fromString(process.env.prodPrivate),
    kinVersion:4
  });

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

    return {balance: sdk.quarksToKin(balance)};

}

//get transaction data using the transaction hash
async function getTransaction(txId) { 

    const txHash = Buffer.from(txId, "hex");
    const transactionData = await client.getTransaction(txHash);

    return transactionData

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

    try{
        const sender = sdk.PrivateKey.fromString(senderPrivate);
        const dest = sdk.PublicKey.fromString(destPublic);

        channel = availChannels.pop();
        console.log('Available Channels (pop):' + availChannels.length);

        let txHash = await client.submitPayment({
            sender: sender,
            destination: dest,
            quarks: sdk.kinToQuarks(amount),
            type: sdk.TransactionType.Spend,
            channel: channel
        });

        availChannels.push(channel)
        console.log('Available Channels (push):' + availChannels.length);

        console.log('Send Kin Success: ' + txHash.toString('hex'));

        return txHash.toString('hex');
    }
    catch (e){
        console.log('Send Kin Fail: ' + e)
        console.log(e);
    }
}

//earn queue (not meant for production, will not save state on server crash)
let earns = [];

// massSend();

//returns global earns (clojure?)
//can't keep using the global variable
//or maybe i can since it's only available to this js file?

// async function earns() { 



// }

//
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

    //let channel;

    if(earnList.length > 0){
        try{

            //TODO: check if available channels, if not, create one
            //channel = availChannels.pop();
            //console.log('Available Channels (pop):' + availChannels.length);

            console.log('start submit');

            const result = await client.submitEarnBatch({
                sender: sender,
                earns: earnList,
                memo: 'buy the ticket, take the ride'
                //channel: channel
            });

            console.log('end submit');

            //availChannels.push(channel)
            //console.log('Available Channels (push):' + availChannels.length);

            if(result.failed.length > 0){
                console.log('Earn Batch Failed Tx:');

                for (let r of result.failed) {

                    let retryDest = r.earn.destination.stellarAddress();
                    let retryAmount = sdk.quarksToKin(r.earn.quarks);

                    console.log('adding to earn queue for retry');
                    addToEarnQueue(retryDest, retryAmount);

                    console.log(result.failed[0].error);

                    // if destination does not exist, don't add back to queue
                    ///if (result.failed[i].error){

                    // // if insuffienient balance, dev wallet needs refilled
                    // if(true){

                    // }

                }

            }
            else{
                console.log('Earn Batch Success: ' + result.succeeded[0].txId.toString('hex'))
            }
        }
        catch (e){
            //TODO: push channel back to array if channel is less than the expected number of channels (won't work )
            console.log('Earn Batch Error: ' + e);
        }
    }

}, null, true, 'America/Los_Angeles');
job.start();

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

module.exports = {
    createAccount,
    getTransaction,
    getBalance,
    sendKin,
    earnEvent
}



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