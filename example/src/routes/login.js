const express = require('express');
const router = express.Router();
router.get('/', (req, res) => {
    res.render('login');
});
router.post('/',(req,res) => {
    let username = req.body.username;
    let password = req.body.password;
    if(username === 'admin' && password ==='admin'){
        req.session.user = username;
        res.redirect('/dashboard');
    }else{
        res.render('login',{error:'Invalid username or password'});
    }
});
module.exports = router;