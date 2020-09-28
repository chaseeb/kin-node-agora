const express = require('express');
const app = express();
const db = require('./db');

const port = process.env.PORT || 3000;
const server = app.listen(port, function() {
  console.log('Express server listening on port ' + port);
});

const KinController = require('./routes/KinController');
app.use('/api/kin', KinController);