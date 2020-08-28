const express = require('express');
const app = express();
const path = require('path')
const kin = require('./kin')
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
app.get('/signTransaction', async function(req, res) {
    try{
        const result = await kin.signTransaction(req, resp);
        return result;
    }
    catch(e){
        console.log(e);
    }
});

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