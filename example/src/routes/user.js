const express = require('express');
const router = express.Router();
const firebase = require('../firebase');
var randomstring = require("randomstring");
let AVATAR = ['F696gEJCteXys5VY88PAv5la7N33.jpg','kdFQ8xxaCjeganYpVVUFBUW4FOC3.jpg','NnwjOc1LhMeVZVuNY1tj9Nod8Lv1.jpg','pTfN1xcgJzfLgMgs5jX3weaBLuq1.jpg','wdsGD6HWcIXarvHc6N68f7Mz8hc2.jpg','yNzfHV6o7qOi9VkDbuid1S0a9Gp1.jpg'];
router.get('/',async (req, res) => {
    /** check login */
    if(!req.session||req.session&& !req.session.user){
        res.redirect('/login');
        return;
    }

    let users = await firebase.getAllUsers();
    /** Convert users object to array */
    let userArray = [];
    Object.keys(users).forEach(function(key) {
        userArray.push(users[key]);
    }, this);
    res.render('users/user',{users:userArray});
});
router.get('/:id',async (req,res) => {
    /** check login */
    if(!req.session||req.session&& !req.session.user){
        res.redirect('/login');
        return;
    }

    let userId = req.params.id;
    if(userId == 'add'){
        let user = {name:'',email:'',slogan:'',address:'',phoneNo:'',avatarLink:'userImages/default_profile.jpg'}
        res.render('users/profile',{user:user,type:'add',posts:[]});
        return;
    }else if(userId.indexOf('deleteUser') > -1){
        firebase.removeUser(userId.replace('deleteUser',''));
        res.redirect('/users');
        return;
    }
    let users = await firebase.getAllUsers();
    let posts = await firebase.getAllPost();
   /** Clean undefine posts */
    let cleanPosts = [];
    let userPosts = [];
    for(let index =0;index < posts.length; index ++){
        var post = posts[index];
        if(post){
            post['shortContent'] = post.description.substring(0,20) + "...";
            if(post.ownerId == userId){
                userPosts.push(post);
            }
        }else{
            cleanPosts.push(index);
        }
    }
    cleanPosts.forEach(index=>{
        posts.splice(index, 1);
    });
    let user = users[userId];
    if(!user){
        user = {name:'',email:'',slogan:'',address:'',phoneNo:'',avatarLink:'userImages/default_profile.jpg'}
        res.render('users/profile',{user:user,type:'add',posts:[]});
    }else{
        if(AVATAR.indexOf(user.avatarLink.replace('userImages/','')) == -1){
            user.avatarLink = 'userImages/default_profile.jpg';
        }
        res.render('users/profile',{user:user,type:'edit',posts:userPosts});
    }
});
router.post('/',async (req, res) => {
    /** check login */
    if(!req.session||req.session&& !req.session.user){
        res.redirect('/login');
        return;
    }
    var userId = randomstring.generate(28);
    let user = req.body;
    if(user.type == "add"){
        user.id = userId;
        user['instanceId'] = userId;
        user['posts'] = [];
        user['isOnline'] = false;
        user['avatarLink'] = 'userImages/default_profile.jpg';
        user['rating'] = 0;
        user['mess'] = [];
        user['followingUsers'] = [];
        user['ratedUsers'] = [];
        user['posts'] = [];
        delete user.type;
        firebase.addUser(user);
    }else{
        delete user.type;
        firebase.updateUser(user);
    }
    res.redirect('/users');
    console.log('post');
});
module.exports = router;