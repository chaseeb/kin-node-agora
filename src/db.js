const mongoose = require('mongoose');
const dotenv = require('dotenv').config();

mongoose.connect(process.env.dbconnectionstring, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
});

const db = mongoose.connection

db.on('error', (error) => console.error(error))
db.once('open', () => console.log('Connected to Database'))

