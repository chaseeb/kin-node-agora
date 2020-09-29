const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
//const Transaction = require('../schemas/Transaction');
//const VerifyToken = require('../VerifyToken');
//const jwt = require('jsonwebtoken');
const UserService = require('../services/UserService');

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json()); 

// Registers a new user
router.post('/register', async function(req, res) {

  try{
    const result = await UserService.register(req.body.email, req.body.password);
    return res.status(200).json(result);
  }
  catch(e) {
    console.log(e);
    res.status(500).json({error: "Error Registering"});
  }

});

// Updates a single user in the database
router.put('/update/:id', async function (req, res) {

  try{
    const user = await UserService.update(req.params.id, req.body.email);  
    res.status(200).json('User email has been updated to ' + user.email);    
  } catch(e){
    console.log(e);
    res.status(500).json({error: e});
  }

});

// Deletes a single user from the database
router.delete('/delete/:id', async function (req, res) {

  try{
    const user = await UserService.deleteuser(req.params.id);
    res.status(200).json(user.email + ' has been deleted');
  } catch(e){
    console.log(e);
    res.status(500).json({error: e});
  }

});

// // Returns all users from the database
// router.get('/getall', async function (req, res) {

//   try{
//     const users = await User
//       .find()
//       .select("-password")
//       .exec();
//       res.status(200).json(users);
//     } catch(err){
//       res.status(500).json({error: err});
//     }

// });

// // Returns a single user from the database
// router.get('/getone/:id', async function (req, res) {

//   try{
//     const user = await User
//       .findById(req.params.id)
//       .select("-password")
//       .exec();
//     res.status(200).json(user);
//     } catch (err){
//       res.status(500).json({error: err});
//     }

// });

module.exports = router;