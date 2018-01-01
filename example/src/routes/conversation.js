const express = require('express');
const router = express.Router();
const firebase = require('../firebase');
var randomstring = require('randomstring');

router.get('/', async(req, res) => {
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
  res.render('conversation/conversation', {
    conversations: conversations,
    admin: req.session.user
  });
});

router.get('/:id', async(req, res) => {
  if (!req.session || (req.session && !req.session.user)) {
    res.redirect('/login');
    return;
  }
  let conversationId = req.params.id;
  let conversation;
  if (conversationId.indexOf('add$') > -1) {
    let date = new Date();
    let user2Id = conversationId.replace('add$', '');
    conversation = await firebase.getConversationBetween2User(req.session.user.id, user2Id);
    if (!conversation) {
      conversationId = randomstring.generate(58);
      conversation = {
        conversationId: req.session.user.id + user2Id,
        idUser1: req.session.user.id,
        idUser2: user2Id,
        lastMessId: 1,
        lastMessTime: date.getTime(),
        lastUser1Mess: 1,
        lastUser2Mess: 0,
        mess: {
          1: {
            author: req.session.user.id,
            id: 1,
            text: 'hello',
            time: date.getTime()
          }
        }
      }
      firebase.addConversation(conversation);
      conversation.mess = [{
        author: req.session.user.id,
        id: 1,
        text: 'hello',
        time: date.getTime()
      }];
    }
  } else {
    conversation = await firebase.getConversation(conversationId);
  }
  if (!conversation) {
    res.render('404');
    return;
  }
  conversation['user1'] = await firebase.getUser(conversation.idUser1);
  conversation['user2'] = await firebase.getUser(conversation.idUser2);
  let mess = [];
  if (conversation.mess) {
    conversation.mess.forEach(message => {
      let date = new Date(message.time);
      message['dateTime'] = date.getHours() + ':' + date.getMinutes() + ' ' + date.getDate() + '/' + (date.getMonth() + 1);
      mess.push(message);
    });
  }
  conversation.mess = mess;
  res.render('conversation/chat', {
    conversation: conversation,
    admin: req.session.user
  });
});
router.post('/push', async(req, res) => {
  let msg = req.body;
  let conversationId = msg.conversationId;
  msg.id = parseInt(msg.id);
  msg.time = parseInt(msg.time);
  delete msg.conversationId;
  firebase.addMsgToConversation(msg, conversationId);
  res.json({
    success: true
  })
});
router.post('/getmsg', async(req, res) => {
  let data = req.body;
  let conversation = await firebase.getConversation(data.conversationId);
  let msg = [];
  if (conversation && conversation.mess) {
    conversation.mess.forEach(mess => {
      if (mess.id > parseInt(data.numberMsg)) {
        msg.push(mess);
      }
    });
  }
  res.json({
    msg: msg
  });
});
module.exports = router;