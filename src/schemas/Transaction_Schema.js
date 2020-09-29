const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({ 
  successful: {
  	type: Boolean,
	required: true,
	unique: false,
	index: false
  },
  sender: {
  	type: String,
  	required: true
  },
  receiver: {
  	type: String,
  	required: true
  },
  amount: {
  	type: String,
  	required: true
  },
  txid:{
    type: String,
    required: false
  },
  createdAt: {
  	type: Date, 
  	default: Date.now,
  	required:  true
  },
});

mongoose.model('Transaction', TransactionSchema);
module.exports = mongoose.model('Transaction');