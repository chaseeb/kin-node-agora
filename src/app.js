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

const KinController = require('./routes/KinController');
app.use('/', KinController);