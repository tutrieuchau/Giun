const express = require('express');
const router = express.Router();
const firebase = require('../firebase');
router.get('/',async (req, res) => {
    var userId = 'sas';// req.params.id;
    if(isNaN(userId)){
        console.log(userId);
        var user = {name:'',email:'',slogan:'',address:'',phoneNo:''}
        res.render('profile',{user:user,type:'add'});
    }
    
});
module.exports = router;