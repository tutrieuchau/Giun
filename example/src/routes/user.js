const express = require('express');
const router = express.Router();
const firebase = require('../firebase');
let AVATAR = ['F696gEJCteXys5VY88PAv5la7N33.jpg','kdFQ8xxaCjeganYpVVUFBUW4FOC3.jpg','NnwjOc1LhMeVZVuNY1tj9Nod8Lv1.jpg','pTfN1xcgJzfLgMgs5jX3weaBLuq1.jpg','wdsGD6HWcIXarvHc6N68f7Mz8hc2.jpg','yNzfHV6o7qOi9VkDbuid1S0a9Gp1.jpg'];
router.get('/',async (req, res) => {
    let users = await firebase.getAllUsers();
    /** Convert users object to array */
    let userArray = [];
    Object.keys(users).forEach(function(key) {
        userArray.push(users[key]);
    }, this);
    res.render('user',{users:userArray});
});

router.get('/:id',async (req,res) => {
    let userId = req.params.id;
    let users = await firebase.getAllUsers();
    let posts = await firebase.getAllPost();
    let user = users[userId];
    if(userId == 'add' || !user){
        user = {name:'',email:'',slogan:'',address:'',phoneNo:''}
        res.render('profile',{user:user,type:'add'});
    }else{
        if(AVATAR.indexOf(user.avatarLink.replace('userImages/','')) == -1){
            user.avatarLink = 'userImages/default_profile.jpg';
        }
        res.render('profile',{user:user,type:'edit'});
    }
});
module.exports = router;