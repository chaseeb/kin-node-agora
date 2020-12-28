const express = require('express');
const router = express.Router();

const KinServiceV2 = require('../services/KinServiceV2');
const webhook = require('@kinecosystem/kin-sdk-v2/dist/webhook');
const sdk = require('@kinecosystem/kin-sdk-v2');

const dotenv = require('dotenv').config();
const bodyParser = require('body-parser');

router.use(bodyParser.json());

// Create Account
router.get('/createAccount', async function(req, res) {
    try{
        const result = await KinServiceV2.createAccount();
        return res.status(200).json(result);
    }
    catch(e){
        console.log(e);
        res.status(500).json({error: "Error Creating Account"});
    }
});

// Get Transaction
router.get('/transaction', async function(req, res) {
    try{
        const result = await KinService.getTransaction(req.parmas.txId);
        res.status(200).json(result);
    }
    catch(e){
        console.log(e);
        res.json({error: 'Error Getting Transaction'});
    }
});

// Get Balance
router.get('/balance/:publicAddress', async function(req, res) {
    try{
        const result = await KinServiceV2.getBalance(req.params.publicAddress);
        return res.status(200).json(result);
    }
    catch(e){
        console.log(e);
        res.status(500).json({error: "Error Getting Balance"});
    }
});

// Get USD Value of Account
router.get('/usdValue/:publicAddress', async function(req, res) {
    try{
        const result = await KinServiceV2.getUsdValue(req.params.publicAddress);
        return res.status(200).json(parseFloat(result));
    }
    catch(e){
        console.log(e);
        res.status(500).json({error: "Error USD Value"});
    }
});

// Get Solana Account Address from Stellar Address
router.get('/solanaAddress/:publicAddress', async function(req, res) {
    try{
        const result = await KinServiceV2.getSolanaAddress(req.body.publicAddress);
        return res.status(200).json(result);
    }
    catch(e){
        console.log(e);
        res.status(500).json({error: "Error Getting Solana Address"});
    }
});

// Get Kin Token Account Address from Stellar Address
router.get('/kinTokenAccount/:publicAddress', async function(req, res) {
    try{
        const result = await KinServiceV2.getKinTokenAccount(req.params.publicAddress);
        return res.status(200).json(result);
    }
    catch(e){
        console.log(e);
        res.status(500).json({error: "Error Getting Kin Token Account Address"});
    }
});

// Get Kin Token Account Url from Stellar Address
router.get('/kinTokenAccountUrl/:publicAddress', async function(req, res) {
    try{
        const result = await KinServiceV2.getKinTokenAccountUrl(req.params.publicAddress);
        return res.status(200).json(result);
    }
    catch(e){
        console.log(e);
        res.status(500).json({error: "Error Getting Kin Token Account URL"});
    }
});

// Get All Account Info for user from Stellar Address
router.get('/accountInfo/:publicAddress', async function(req, res) {
    try{
        const result = await KinServiceV2.getAccountInfo(req.params.publicAddress);
        return res.status(200).json(result);
    }
    catch(e){
        console.log(e);
        res.status(500).json({error: "Error Getting User Account Info"});
    }
});

// Get Kin Token Rank from CMC
router.get('/rank', async function(req, res) {
    try{
        const result = await KinService.getKinRank();
        return res.status(200).json(result);
    }
    catch(e){
        console.log(e);
        res.status(500).json({error: "Error Getting Rank"});
    }
});

// Get Kin Token Price
router.get('/price', async function(req, res) {
    try{
        const result = await KinServiceV2.getKinPrice();
        return res.status(200).json(result);
    }
    catch(e){
        console.log(e);
        res.status(500).json({error: "Error Getting Price"});
    }
});

router.get('/marketCap', async function(req, res) {
    try{
        const result = await KinService.getKinMarketCap();
        return res.status(200).json(result);
    }
    catch(e){
        console.log(e);
        res.status(500).json({error: "Error Getting Market Cap"});
    }
});

router.get('/circSupply', async function(req, res) {
    try{
        const result = await KinService.getKinCircSupply();
        return res.status(200).json(result);
    }
    catch(e){
        console.log(e);
        res.status(500).json({error: "Error Getting Circulating Supply"});
    }
});

// Get All Kin Token Info
router.get('/kinInfo', async function(req, res) {
    try{
        const result = await KinServiceV2.getKinInfo();
        return res.status(200).json(result);
    }
    catch(e){
        console.log(e);
        res.status(500).json({error: "Error Kin User Information"});
    }
});

// Add Earn Event to Queue if Valid
router.get('/earnEvent', async function(req, res) {
    try{
        const result = await KinService.earnEvent(req.body.dest, req.body.amount);
        return res.sendStatus(result);
    }
    catch(e){
        console.log(e);
        res.json({error: 'Error Paying Earn'});
    }
});

//Send Kin Using Private Key and Stellar Destination
router.get('/sendKin', async function(req, res) {

    try{
        const result = await KinService.sendKin(req.body.sender, req.body.dest, req.body.amount);
        return res.json({txHash:result});
    }
    catch(e){
        console.log(e);
        res.json({error: 'Errror Sending Kin'});
    }

});

// Sign a spend Transaction to whitelist it
// This webhook is called when your user spends Kin in your app
router.use('/signTransaction', express.json());
router.use("/signTransaction", webhook.SignTransactionHandler(sdk.Environment.Prod, (req, resp) => {

    //switch to base58
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

module.exports = router;

//...........................................................

// *** add "donationAddress" to every single response

// *** find a way to charge Kin for every api call - api user has to send 100 kin to developer wallet, 
// and receives 1 kin returned with the memo as their api key that will asts for 30 days
