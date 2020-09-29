const mongoose = require('mongoose');
//const Transaction = require('./Transaction').schema;

const UserSchema = new mongoose.Schema({ 
  email: {
  	type: String,
	required: true,
	unique: true,
	index: true
  },
  password: {
  	type: String,
  	required: true
  }
//   publicAddress: {
//   	type: String,
//   	required: true
//   },
//   createdAt: {
//   	type: Date, 
//   	default: Date.now,
//   	required:  true
//   },
//   updatedAt: {
//   	type:  Date,
//   	default: Date.now,
//   	required: true
//   },
//   transactions: [Transaction]
});

mongoose.model('User', UserSchema);
module.exports = mongoose.model('User');