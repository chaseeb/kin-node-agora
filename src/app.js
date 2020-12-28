const express = require('express');
const app = express();
//DB does not connect until this is required
//const db = require('./db');

const port = process.env.PORT || 3000;
const server = app.listen(port, function() {
  console.log('Express server listening on port ' + port);
});

app.set('view engine', 'ejs'); 

// process.on('uncaughtException', function(err) {
//   console.log('Caught exception: ' + err);
// });

//TODO: return the current API docs
app.get('/', async function(req, res) {
  res.render('index');
});

const KinController = require('./routes/KinControllerV2');
app.use('/api/kin', KinController);