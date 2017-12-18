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
    let returnPosts = [];
    /** remote undefine object */
    posts.forEach(post => {
        let authorOb = users[post.ownerId];
        post['author'] = authorOb? authorOb.name : 'Admin';
        post['shortContent'] = post.description.substring(0,30) + "...";
        /** Convert timestamp to date */
        let date = new Date(post.timePosted);
        post['date'] = date.getDate() + '/' + date.getMonth() + '/' + date.getFullYear();
        returnPosts.push(post);
    })
    res.render('posts/post',{posts:returnPosts});
});
router.get('/:id',async (req,res) => {
    if(!req.session||req.session&& !req.session.user){
        res.redirect('/login');
        return;
    }
    let postId = req.params.id;
    let post = await firebase.getPost(postId);
    let user = await firebase.getUser(post.ownerId);
    let postImages = await firebase.getAllPostImage(postId);
    res.render('posts/details',{post:post,user:user,postImages:postImages,type:'edit'});
});
module.exports = router;