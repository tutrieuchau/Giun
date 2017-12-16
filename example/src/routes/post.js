const express = require('express');
const router = express.Router();
const firebase = require('../firebase');
router.get('/',async (req, res) => {

    /** check login */
    if(!req.session||req.session&& !req.session.user){
        res.redirect('/login');
        return;
    }

    let posts = await firebase.getAllPost();
    let users = await firebase.getAllUsers();
    let removeIndex = [];
    for(let index = 0; index < posts.length ; index ++){
        let post = posts[index];
        if(post){
            let authorOb = users[post.ownerId];
            post['author'] = authorOb? authorOb.name : 'Admin';
            post['shortContent'] = post.description.substring(0,30) + "...";
            /** Convert timestamp to date */
            let date = new Date(post.timePosted);
            post['date'] = date.getDate() + '/' + date.getMonth() + '/' + date.getFullYear();
        }else{
            removeIndex.push(index);
        }
    }
    /** remote undefine object */
    removeIndex.forEach(index => {
        posts.splice(index, 1);
    });
    res.render('posts/post',{posts:posts});
});
router.get('/:id',async (req,res) => {
    if(!req.session||req.session&& !req.session.user){
        res.redirect('/login');
        return;
    }
    let postId = req.params.id;
    let post = await firebase.getPost(postId);
    let user = await firebase.getUser(post.ownerId);
    res.render('posts/details',{post:post,user:user,type:'edit'});
});
module.exports = router;