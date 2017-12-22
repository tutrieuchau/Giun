const express = require('express');
const router = express.Router();
const firebase = require('../firebase');
const CATEGORY = ["ACCESSORIES","BABY AND TOYS","CLOTHS","ELECTRONICS","GROCERIES","HOME AND LIVING","PETS","OTHERS"];
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
        post.category = CATEGORY[post.category-1];
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
    if(postId == "add"){
        let post = {"description":"","comments":[]};
        let user = {"name":"admin","email":"admin@pikerfree.com","avatarLink":"/firebase/userImages/default_profile.jpg"}
        res.render('posts/details',{post:post,user:user,postImages:[],type:'add'});
        return;
    }else{
        let post = await firebase.getPost(postId);
        let user = await firebase.getUser(post.ownerId);
        if(post.comments){
            for(let index = 0; index < post.comments.length; index ++){
                let comment = post.comments[index];
                comment["user"] = await firebase.getUser(comment.idUser);
            }
        }else{
            post["comments"] = [];
        }
        
        let postImages = await firebase.getAllPostImageLink(postId);
        res.render('posts/details',{post:post,user:user,postImages:postImages,type:'edit'});
    }
    
});
module.exports = router;