const express = require('express');
const app = express();
const path = require('path')
const kin = require('./kin')
const webhook = require('@kinecosystem/kin-sdk-v2/dist/webhook');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Create Kin Account Endpoint
app.get('/createAccount', async function(req, res) {
    try{
        const result = await kin.createAccount();
        return res.json({publicKey:result});
    }
    catch(e){
        console.log(e);
    }
});

// Get Transaction Endpoint
app.get('/getTransaction', async function(req, res) {
    try{
        const result = await kin.getTransaction();
        return res.json(result);
    }
    catch(e){
        console.log(e);
    }
});

// Get Balance Endpoint
app.get('/getBalance', async function(req, res) {
    try{
        const result = await kin.getBalance();
        return res.json({balance:result});
    }
    catch(e){
        console.log(e);
    }
});

// Send Kin Endpoint
app.get('/sendKin', async function(req, res) {

    try{
        const result = await kin.sendKin(process.env.prodPrivate, req.body.publicKey, req.body.amount);
        return res.json({txHash:result});
    }
    catch(e){
        console.log(e);
    }

});

// Send Batch Kin Endpoint
app.get('/sendBatchKin', async function(req, res) {
    try{
        const result = await kin.sendBatchKin();
        return res.json({txHash:result});
    }
    catch(e){
        console.log(e);
    }
});

// Sign Transaction Webhook Endpoint
app.use("/sign_transaction", webhook.SignTransactionHandler(Environment.Prod, (req, resp) => {
    console.log(`sign request for <'${req.userId}', '${req.userPassKey}'>: ${req.txHash().toString('hex')}`);

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

// Events Webhook Endpoint
app.get('/events', async function(req, res) {
    try{
        const result = await kin.processEvent();
        return res.json({txHash:result});
    }
    catch(e){
        console.log(e);
    }
});

const port = process.env.PORT || 3000;

const server = app.listen(port, function() {
  console.log('Express server listening on port ' + port);
});