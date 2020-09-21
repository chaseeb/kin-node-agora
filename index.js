const express = require('express');
const app = express();
const kin = require('./kin')
const webhook = require('@kinecosystem/kin-sdk-v2/dist/webhook');
const sdk = require('@kinecosystem/kin-sdk-v2');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// Takes the name of kin function and required params and sends to router to process accordingly
// app.get('/kin', async function(req, res) {
//     try{
//         const result = await kin.router(req.body);
//         return res.json(result);
//     }
//     catch(e){
//         console.log(e);
//         res.json({error: e});
//     }
// });

// Create Kin Account w/ Public Address
app.get('/createAccount', async function(req, res) {
    try{
        const result = await kin.createAccount();
        return res.json({publicKey:result});
    }
    catch(e){
        console.log(e);
        res.json({error: e});
    }
});

// Get Transaction by TransactionId
app.get('/getTransaction', async function(req, res) {
    try{
        const result = await kin.getTransaction(req.body.txId);
        return res.json(result);
    }
    catch(e){
        console.log(e);
        res.json({error: e});
    }
});

// Get Balance by Public Address
app.get('/getBalance', async function(req, res) {
    try{
        const result = await kin.getBalance(req.body.pubicAddress);
        return res.json({balance:result});
    }
    catch(e){
        console.log(e);
    }
});

// Simulate a client sending kin to the app (spend) or anyother user(p2p)
app.get('/sendKin', async function(req, res) {

    try{
        const result = await kin.sendKin(req.body.senderPrivate, req.body.publicKey, req.body.amount);
        return res.json({txHash:result});
    }
    catch(e){
        console.log(e);
        res.json({error: e});
    }

});

// Add transaction to queue for later batch processing
app.get('/addToEarnQueue', async function(req, res) {
    try{
        const result = await kin.addToEarnQueue(req.body.dest, req.body.amount);
        return res.sendStatus(result);
    }
    catch(e){
        console.log(e);
        res.json({error: e});
    }
});

// Sign a spend Transaction to whitelist it (or not
app.use('/signTransaction', express.json());
app.use("/signTransaction", webhook.SignTransactionHandler(sdk.Environment.Prod, (req, resp) => {
    console.log(`sign request for txID '${req.txHash().toString('hex')}`);

    const whitelistKey = sdk.PrivateKey.fromString(process.env.prodPrivate);

    for (let i = 0; i < req.payments.length; i++) {
        const p = req.payments[i];

        // Double check that the transaction isn't trying to impersonate us
        if (p.sender.equals(whitelistKey.publicKey())) {
            resp.reject();
            return;
        }

        // In this example, we don't want to whitelist transactions that aren't sending
        // kin to us.
        if (p.destination.equals(whitelistKey.publicKey())) {
            resp.markWrongDestination(i);
        }

        if (p.invoice) {
            for (let item of p.invoice.Items) {
                if (!item.sku) {
                    // Note: in general the sku is optional. However, in this example we
                    //       mark it as SkuNotFound to facilitate testing.
                    resp.markSkuNotFound(i);
                }
            }
        }
    }

    // Note: if we _don't_ do this check here, the SDK won't send back a signed
    //       transaction if this is set.
    if (resp.isRejected()) {
        return;
    }

    // Note: if we didn't sign or reject, then the transaction will still go through,
    //       but fees will be charged.
    resp.sign(whitelistKey);
}, process.env.secret))

// Webhook to receive all transaction events that happen using your AppIndex
app.use("/events", express.json());
app.use("/events", webhook.EventsHandler((events) => {
    console.log("/events");
    console.log(events);
    for (let e of events) {
        console.log(`received event: ${JSON.stringify(e)}`)
    }
}, process.env.secret));

const port = process.env.PORT || 3000;

const server = app.listen(port, function() {
  console.log('Express server listening on port ' + port);
});