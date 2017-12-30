const express = require('express');
const router = express.Router();
const firebase = require('../firebase');
router.get('/', (req, res) => {
  if (req.session && req.session.user) {
    res.redirect('/dashboard');
    return;
  } else {
    res.render('login');
  }
});
router.post('/', async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  let admin = await firebase.getUserByUsername('admin');
  if (username == 'admin' && admin && password == 'password') {
    admin.avatarLink = await firebase.getUserAvatarLink(admin.avatarLink);
    req.session.user = admin;
    res.redirect('/dashboard');
  } else {
    res.render('login', { error: 'Invalid username or password' });
  }
});
module.exports = router;
