const express = require('express');
const app = express();
//DB does not connect until this is required
//const db = require('./db');

const port = process.env.PORT || 3000;
const server = app.listen(port, function() {
  console.log('Express server listening on port ' + port);
});

// process.on('uncaughtException', function(err) {
//   console.log('Caught exception: ' + err);
// });

//TODO: return the current API
app.get('/', async function(req, res) {
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

const KinService = require('./services/KinService');
app.get('/accountInfo/:publicAddress', async function(req, res) {
  try{
      const result = await KinService.getAccountInfo(req.params.publicAddress);
      console.log(result);

      res.header("Content-Type",'application/json');
      res.send(JSON.stringify(result, null, 4));
      //res.status(200).send(JSON.stringify(result));
  }
  catch(e){
      console.log(e);
      res.json({error: e});
  }
});

const KinController = require('./routes/KinController');
app.use('/api/kin', KinController);