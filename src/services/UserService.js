const bcrypt = require('bcrypt');
const User = require('../schemas/User_Schema');
const mongoose = require('mongoose'); 

async function register(email, password) { 

    const hashedPassword = await bcrypt.hashSync(password, 8);
    const user = new User({
      _id: new mongoose.Types.ObjectId(),
      email: email,
      password: hashedPassword
      //publicAddress: req.body.publicAddress
    });
    return await user.save();

}

async function update(id, blah) { 

    console.log(blah);

    const user = await User
    .findById(id)
    .exec();
    user.email = blah;
    return await user.save();

}

async function deleteuser(id) { 

    const user = await User.findById(id)
    .exec();
    return await user.delete();

}

module.exports = {register, update, deleteuser};