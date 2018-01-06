const express = require('express');
const router = express.Router();
const firebase = require('../firebase');
var randomstring = require('randomstring');
const multer = require('multer');
let upload = multer({
  dest: 'uploads/'
});

router.get('/', async(req, res) => {
  /** check login */
  if (!req.session || (req.session && !req.session.user)) {
    res.redirect('/login');
    return;
  }

  let users = await firebase.getAllUsers();
  if (users) {
    users = users.filter(user => {
      return user.name != 'admin' && user.id
    });
  }
  res.render('users/user', {
    users: users,
    admin: req.session.user
  });
});
router.get('/:id', async(req, res) => {
  /** check login */
  if (!req.session || (req.session && !req.session.user)) {
    res.redirect('/login');
    return;
  }
  /** Add or Delete User */
  let userId = req.params.id;
  if (userId == 'add') {
    let users = await firebase.getAllUsers();
    let emailArray = [];
    Object.keys(users).forEach(function (key) {
      if (users[key].name !== 'admin') {
        emailArray.push(users[key].email);
      }
    }, this);
    let user = {
      name: '',
      email: '',
      rating: 0,
      address: '',
      phoneNo: '',
      avatarLink: '/firebase/userImages/default_profile.jpg',
    };
    res.render('users/profile', {
      user: user,
      type: 'add',
      posts: [],
      admin: req.session.user,
      emails: emailArray
    });
    return;
  } else if (userId.indexOf('deleteUser') > -1) {
    let user = await firebase.getUser(userId.replace('deleteUser', ''));
    firebase.removeUser(user);
    res.redirect('/users');
    return;
  }

  let user = await firebase.getUser(userId);
  if (!user) {
    res.redirect('/404');
    return;
  }
  let userPosts = await firebase.getAllUserPosts(userId);
  let followingUsers = [];
  if (user.followingUsers) {
    for (let i = 0; i < user.followingUsers.length; i++) {
      let followingUser = await firebase.getUser(user.followingUsers[i]);
      if (followingUser) {
        followingUsers.push(followingUser);
      }
    }
  }
  res.render('users/profile', {
    user: user,
    type: 'edit',
    posts: userPosts,
    admin: req.session.user,
    followingUsers: followingUsers
  });
});
router.post('/', upload.single('avatarImages'), (req, res, next) => {
  /** check login */
  if (!req.session || (req.session && !req.session.user)) {
    res.redirect('/login');
    return;
  }
  var userId = randomstring.generate(28);
  let user = req.body;
  if (user.rating == NaN || user.rating == '') {
    user.rating = 0;
  } else {
    user.rating = parseFloat(user.rating);
  }
  let avatar = req.file;
  if (user.type == 'add') {
    user.id = userId;
    user['posts'] = [];
    user['mess'] = [];
    user['followingUsers'] = [];
    user['ratedUsers'] = [];
    user['posts'] = [];
    if (avatar) {
      user['avatarLink'] = 'userImages/' + user.id + '.' + avatar.mimetype.split('/')[1];
      firebase.uploadImage(avatar.path, 'userImages/' + user.id + '.' + avatar.mimetype.split('/')[1]);
    } else {
      user['avatarLink'] = 'userImages/default_profile.jpg';
    }
    delete user.type;
    delete user.bkAvatarLink;
    firebase.addUser(user);
  } else {
    if (avatar) {
      user['avatarLink'] = 'userImages/' + user.id + '.' + avatar.mimetype.split('/')[1];
      firebase.deleteImage(user.bkAvatarLink);
      firebase.uploadImage(avatar.path, 'userImages/' + user.id + '.' + avatar.mimetype.split('/')[1]);
    } else {
      user['avatarLink'] = user.bkAvatarLink;
    }
    delete user.type;
    delete user.bkAvatarLink
    firebase.updateUser(user);
  }
  res.redirect('/users');
});
module.exports = router;