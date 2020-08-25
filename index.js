const express = require('express');
const app = express();
const path = require('path')
const kin = require('./kin')

// Create Kin Account Endpoint
app.get('/createAccount', async function(req, res) {
    try{
        const result = await kin.createAccount();
        return res.send(result);
    }
    catch(e){
        console.log(e);
    }
});

const port = process.env.PORT || 3000;

const server = app.listen(port, function() {
  console.log('Express server listening on port ' + port);
});