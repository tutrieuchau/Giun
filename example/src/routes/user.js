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

router.get('/:id', (req,res) => {
    var user = {name:'',email:'',slogan:'',address:'',phoneNo:''}
    res.render('main',{user:user,type:'add'});
});

router.get('/add',(req,res)=>{
    var user = {name:'',email:'',slogan:'',address:'',phoneNo:''}
    res.render('profile',{user:user,type:'add'});
});
module.exports = router;