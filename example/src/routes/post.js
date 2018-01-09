const express = require('express');
const router = express.Router();
const firebase = require('../firebase');
const multer = require('multer');
let upload = multer({
  dest: 'uploads/'
});
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
router.get('/', async(req, res) => {
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
    let authorOb = users.filter(user => {
      return user.id == post.ownerId;
    })[0];
    post.category = CATEGORY[post.category - 1];
    post['author'] = authorOb ? authorOb.name : 'Admin';
    post['shortContent'] = post.description.substring(0, 30) + '...';
    /** Convert timestamp to date */
    let date = new Date(post.timePosted);
    post['date'] =
      date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
    returnPosts.push(post);
  });
  res.render('posts/post', {
    posts: returnPosts,
    admin: req.session.user
  });
});
router.get('/:id', async(req, res) => {
  if (!req.session || (req.session && !req.session.user)) {
    res.redirect('/login');
    return;
  }
  let postId = req.params.id;
  let defaultUser = req.session.user;
  if (postId == 'add') {
    let post = {
      description: '',
      comments: []
    };
    let user = defaultUser;
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
      user = defaultUser;
    }
    let post = {
      description: '',
      comments: []
    };
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
    postId = postId.replace('deletePost', '');
    let post = await firebase.getPost(parseInt(postId));
    if (post) {
      firebase.removePost(post.ownerId, parseInt(postId.replace('deletePost', '')));
      firebase.removePostImage(postId.replace('deletePost', ''));
    }
    if (req.headers.referer && req.headers.referer.indexOf('dashboard') > -1) {
      res.redirect('/dashboard');
    } else {
      res.redirect('/posts');
    }
  } else {
    let post = await firebase.getPost(parseInt(postId));
    let user = await firebase.getUser(post.ownerId);
    if (!user) {
      user = defaultUser;
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
        return n !== undefined && n.user !== null;
      });
    } else {
      post['comments'] = [];
    }
    /** check return page */
    var dashboard = false;
    if (req.headers.referer && req.headers.referer.indexOf('dashboard') > -1) {
      dashboard = true;
    };
    let postImages = await firebase.getAllPostImageLink(postId);
    res.render('posts/details', {
      post: post,
      user: user,
      postImages: postImages,
      type: 'edit',
      admin: req.session.user,
      dashboard: dashboard
    });
  }
});

router.post(
  '/',
  upload.fields([{
    name: 'postImages',
    maxCount: 20
  }]),
  async(req, res) => {
    if (!req.session || (req.session && !req.session.user)) {
      res.redirect('/login');
      return;
    }
    let post = req.body;
    post.location = {
      latitude: parseFloat(post.location.split(',')[0]),
      longitude: parseFloat(post.location.split(',')[1])
    }
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
      let postsCount = await firebase.getPostCount();
      if (postsCount) {
        post['postId'] = postsCount + 1;
      } else {
        post['postId'] = 0;
      }
      post.category = parseInt(post.category);
      firebase.addPost(post);
    } else {
      delete post.type;
      post['comments'] = [];
      firebase.updatePost(post);
      /** remove images */
    }
    if (postImages) {
      let postImgLinks = await firebase.getAllPostImageLink(post.postId);
      let imgCount = postImgLinks.length;
      postImages.forEach(image => {
        firebase.uploadImage(
          image.path,
          'postImages/' + post.postId + '/' + 'image_no_' + imgCount + '.' + image.mimetype.split('/')[1]
        );
        imgCount++;
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
// Add Comment
router.post('/comments', async(req, res) => {
  let data = req.body;
  // data.commentId /data.comment / data.idUser/data.postId
  let post = await firebase.getPost(data.postId);
  if (post && post.comments) {
    if (data.type == 'add') {
      post.comments.push({
        comment: data.comment,
        idUser: req.session.user.id
      });
    } else if (post && data.type == 'edit') {
      post.comments[parseInt(data.commentId)].comment = data.comment;
    } else if (data.type == 'delete') {
      delete post.comments.splice(parseInt(data.commentId), 1);
    }
    firebase.updatePostComments(data.postId, post.comments);
  } else if (post) {
    if (data.type == 'add') {
      post['comments'] = [{
        comment: data.comment,
        idUser: req.session.user.id
      }];
      firebase.updatePostComments(data.postId, post.comments);
    }
  }
  res.json({});
});
module.exports = router;