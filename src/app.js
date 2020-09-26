const express = require('express');
const app = express();

const KinController = require('./routes/KinController');
app.use('/api/kin', KinController);

module.exports = app;