const express = require('express');
const router = express.Router();
const firebase = require('../firebase');
const multer = require('multer');
let upload = multer({ dest: 'uploads/' });
const CATEGORY = [
  'ACCESSORIES',
  'BABY AND TOYS',
  'CLOTHS',
  'ELECTRONICS',
  'GROCERIES',
  'HOME AND LIVING',
  'PETS',
  'OTHERS'
];
router.get('/', async (req, res) => {
  /** check login */
  if (!req.session || (req.session && !req.session.user)) {
    res.redirect('/login');
    return;
  }

  let posts = await firebase.getAllPost();
  let users = await firebase.getAllUsers();
  let returnPosts = [];
  /** remote undefine object */
  posts.forEach(post => {
    let authorOb = users[post.ownerId];
    post.category = CATEGORY[post.category - 1];
    post['author'] = authorOb ? authorOb.name : 'Admin';
    post['shortContent'] = post.description.substring(0, 30) + '...';
    /** Convert timestamp to date */
    let date = new Date(post.timePosted);
    post['date'] =
      date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
    returnPosts.push(post);
  });
  res.render('posts/post', { posts: returnPosts, admin: req.session.user });
});
router.get('/:id', async (req, res) => {
  if (!req.session || (req.session && !req.session.user)) {
    res.redirect('/login');
    return;
  }
  let postId = req.params.id;
  if (postId === 'add') {
    let post = { description: '', comments: [] };
    let user = {
      name: 'admin',
      email: 'admin@pikerfree.com',
      avatarLink: '/firebase/userImages/default_profile.jpg'
    };
    let users = await firebase.getAllUsers();
    res.render('posts/details', {
      post: post,
      user: user,
      users: users,
      postImages: [],
      type: 'add',
      admin: req.session.user
    });
    return;
  }

  if (postId.indexOf('add&') > -1) {
    let userId = postId.substring(4);
    let user = await firebase.getUser(userId);
    if (!user) {
      user = {
        name: 'admin',
        email: 'admin@pikerfree.com',
        avatarLink: '/firebase/userImages/default_profile.jpg'
      };
    }
    let post = { description: '', comments: [] };
    res.render('posts/details', {
      post: post,
      user: user,
      users: undefined,
      postImages: [],
      type: 'add',
      admin: req.session.user
    });
    return;
  }

  if (postId.indexOf('deletePost') > -1) {
    firebase.removePost(postId.replace('deletePost', ''));
    firebase.removePostImage(postId.replace('deletePost', ''));
    res.redirect('/posts');
  } else {
    let post = await firebase.getPost(postId);
    let user = await firebase.getUser(post.ownerId);
    if (!user) {
      user = {
        name: 'admin',
        email: 'admin@pikerfree.com',
        avatarLink: '/firebase/userImages/default_profile.jpg'
      };
    }
    if (post.comments) {
      for (let index = 0; index < post.comments.length; index++) {
        let comment = post.comments[index];
        if (comment) {
          comment['no'] = index;
          comment['user'] = await firebase.getUser(comment.idUser);
        }
      }
      post.comments = post.comments.filter((n) => {
        return n !== undefined;
      });
    } else {
      post['comments'] = [];
    }

    let postImages = await firebase.getAllPostImageLink(postId);
    res.render('posts/details', {
      post: post,
      user: user,
      postImages: postImages,
      type: 'edit',
      admin: req.session.user
    });
  }
});

router.post(
  '/',
  upload.fields([{ name: 'postImages', maxCount: 20 }]),
  async (req, res) => {
    if (!req.session || (req.session && !req.session.user)) {
      res.redirect('/login');
      return;
    }
    let post = req.body;
    post.location = {latitude: parseFloat(post.location.split(',')[0]), longitude: parseFloat(post.location.split(',')[1])}
    let postImages = req.files.postImages;
    let deleteMedia = post.deleteMedia;
    delete post.deleteMedia;
    if (post.type === 'add') {
      delete post.type;
      post['comments'] = [];
      post['status'] = 1;
      post['timePosted'] = new Date().getTime();
      // post['ownerId'] = 'admin';
      post['requestingUser'] = [];
      /** get last id of posts */
      let posts = await firebase.getAllPost();
      if (posts) {
        post['postId'] = posts[posts.length - 1].postId + 1;
      } else {
        post['postId'] = 1;
      }
      if (post.comments) {
        let comments = [];
        post.comments.forEach(comment => {
          comments.push({idUser: '28rye26zFkfjvx1Djoz1ibKErAE2', comment: comment});
        });
        post.comments = comments;
      }
      firebase.addPost(post);
    } else {
      if (post.comments) {
        let comments = [];
        let oldPost = await firebase.getPost(post.postId);
        if (oldPost && oldPost.comments) {
          post.comments.forEach(comment => {
            let cmId = comment.split('[$]')[0];
            if (isNaN(cmId)) {
              comments.push({idUser: '28rye26zFkfjvx1Djoz1ibKErAE2', comment: comment});
            } else {
              let oldComment = oldPost.comments[parseInt(cmId)];
              if (oldComment) {
                oldComment.comment = comment.split('[$]')[1];
                comments.push(oldComment);
              }
            }
          });
        } else {
          post.comments.forEach(comment => {
            comments.push({idUser: '28rye26zFkfjvx1Djoz1ibKErAE2', comment: comment});
          });
        }
        post.comments = comments;
      } else {
        post['comments'] = [];
      }
      firebase.updatePost(post);
      /** remove images */
    }
    if (postImages) {
      postImages.forEach(image => {
        firebase.uploadImage(
          image.path,
          'postImages/' + post.postId + '/' + image.originalname
        );
      });
    }
    if (deleteMedia) {
      deleteMedia.forEach(image => {
        firebase.deleteImage(image);
      });
    }
    res.redirect('/posts');
  }
);
module.exports = router;
