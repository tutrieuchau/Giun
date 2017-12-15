const express = require('express');
const router = express.Router();
const firebase = require('../firebase');
router.get('/',async (req, res) => {
    let users = await firebase.getAllUsers();
    /** Convert users object to array */
    let userArray = [];
    Object.keys(users).forEach(function(key) {
        userArray.push(users[key]);
    }, this);
    res.render('user',{users:userArray});
});
router.get('/profile', (req,res) => {
     res.render('profile');
});
module.exports = router;