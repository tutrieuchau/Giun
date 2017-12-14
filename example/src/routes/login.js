const express = require('express');
const router = express.Router();
router.get('/', (req, res) => {
    res.render('login');
});
router.post('/',(req,res) => {
    console.log(req.body.username);
    let username = req.body.username;
    let password = req.body.password;
    if(username === 'admin' && password ==='admin'){
        
    }
});
module.exports = router;