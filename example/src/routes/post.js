const express = require('express');
const router = express.Router();
const firebase = require('../firebase');
router.get('/',async (req, res) => {
    // firebase.getAllFireBaseData();
    let users = await firebase.getAllUsers();
    console.log(users);
});
module.exports = router;