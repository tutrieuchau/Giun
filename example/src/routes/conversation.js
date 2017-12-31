const express = require('express');
const router = express.Router();
const firebase = require('../firebase');

router.get('/', async (req, res) => {
  if (!req.session || (req.session && !req.session.user)) {
    res.redirect('/login');
    return;
  }
  const conversations = await firebase.getAllConversations();
  const users = await firebase.getAllUsers();
  let conversationArray = [];
  Object.keys(conversations).forEach(key => {
    conversations[key]['user1'] = users[conversations[key].idUser1];
    conversations[key]['user2'] = users[conversations[key].idUser2];
    conversationArray.push(conversations[key]);
  }, this);
  res.render('conversation/conversation', { conversations: conversations, admin: req.session.user });
});

router.get('/:id', async (req, res) => {
  let conversationId = req.params.id;
  let conversation = await firebase.getConversation(conversationId);
  if (!conversation) {
    res.render('404');
    return;
  }
  conversation['user1'] = await firebase.getUser(conversation.idUser1);
  conversation['user2'] = await firebase.getUser(conversation.idUser2);
  let mess = [];
  conversation.mess.forEach(message => {
    let date = new Date(message.time);
    message['dateTime'] = date.getHours() + ':' + date.getMinutes() + ' ' + date.getDate() + '/' + date.getMonth();
    mess.push(message);
  });
  conversation.mess = mess;
  res.render('conversation/chat', { conversation: conversation, admin: req.session.user });
});
module.exports = router;
