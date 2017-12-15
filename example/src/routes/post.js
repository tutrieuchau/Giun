const express = require('express');
const router = express.Router();
const firebase = require('../firebase');
router.get('/',async (req, res) => {
    // firebase.getAllFireBaseData();
    let posts = await firebase.getAllPost();
    console.log(posts);
    res.render('post');
});
module.exports = router;