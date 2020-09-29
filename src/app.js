const express = require('express');
const app = express();
//DB does not connect until this is required
//const db = require('./db');

const port = process.env.PORT || 3000;
const server = app.listen(port, function() {
  console.log('Express server listening on port ' + port);
});

const UserController = require('./routes/UserController');
app.use('/api/user', UserController);

const KinController = require('./routes/KinController');
app.use('/api/kin', KinController);