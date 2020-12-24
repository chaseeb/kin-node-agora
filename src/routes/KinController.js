const express = require('express');
const router = express.Router();

const KinService = require('../services/KinService');
const webhook = require('@kinecosystem/kin-sdk-v2/dist/webhook');
const sdk = require('@kinecosystem/kin-sdk-v2');

const dotenv = require('dotenv').config();
const bodyParser = require('body-parser');

router.use(bodyParser.json());

//TODO: return the current API
router.get('/', async function(req, res) {
    // try{
    //     const result = await KinService.createAccount();
    //     return res.status(200).json(result);
    // }
    // catch(e){
    //     console.log(e);
    //     res.status(500).json({error: "Account creation failure."});
    // }
    res.send('This is the API.')
});

// Create Kin Account
// For server use only (channels), not for creating client user accounts
router.get('/createAccount', async function(req, res) {
    try{
        const result = await KinService.createAccount();
        return res.status(200).json(result);
    }
    catch(e){
        console.log(e);
        res.status(500).json({error: "Account creation failure."});
    }
});

// Get Balance of user by Public Address
router.get('/getBalance', async function(req, res) {
    try{
        console.log('Getting Balance...');
        const result = await KinService.getBalance(req.body.publicAddress);
        console.log(result);
        return res.status(200).json(result);
    }
    catch(e){
        console.log(e);
        res.status(500).json({error: "Get Balance Failure"});
    }
});

// Get Transaction of user by TransactionId
router.get('/getTransaction', async function(req, res) {
    try{
        const result = await KinService.getTransaction(req.body.txId);
        console.log(result);
        res.status(200).json(result);
    }
    catch(e){
        console.log(e);
        res.json({error: e});
    }
});


router.get('/accountInfo/:publicAddress', async function(req, res) {
    try{
        const result = await KinService.getAccountInfo(req.params.publicAddress);
        console.log(result);
        res.status(200).send(JSON.stringify(result));
    }
    catch(e){
        console.log(e);
        res.json({error: e});
    }
});

// Earn Event Triggered by User in App
// Add to earn queue if valid earn (type, amount, etc)
router.get('/earnEvent', async function(req, res) {
    try{
        const result = await KinService.earnEvent(req.body.dest, req.body.amount);
        return res.sendStatus(result);
    }
    catch(e){
        console.log(e);
        res.json({error: e});
    }
});

// Sign a spend Transaction to whitelist it
// This webhook is called when your user spends Kin in your app
router.use('/signTransaction', express.json());
router.use("/signTransaction", webhook.SignTransactionHandler(sdk.Environment.Prod, (req, resp) => {
    console.log(`sign request for txID '${req.txId().toString('hex')}`);

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
        // if (!p.destination.equals(whitelistKey.publicKey())) {
        //     resp.markWrongDestination(i);
        // }

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
}, process.env.webhook_secret))

// Webhook to receive all transaction events that happen using your AppIndex
// This is not required, but can be useful to track and store kin events happening in your app
router.use("/events", express.json());
router.use("/events", webhook.EventsHandler((events) => {
    for (let e of events) {
        console.log(`received event: ${JSON.stringify(e)}`)
    }
}, process.env.webhook_secret));

// Simulate a client sending kin to the app (spend) or anyother user(p2p)
// Testing purposes only
router.get('/sendKin', async function(req, res) {

    try{
        const result = await KinService.sendKin(req.body.sender, req.body.dest, req.body.amount);
        return res.json({txHash:result});
    }
    catch(e){
        console.log('Send Kin Fail:');
        console.log(e);
        res.json({error: e});
    }

});

module.exports = router;