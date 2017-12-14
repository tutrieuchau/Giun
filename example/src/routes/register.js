const express = require('express');
const router = express.Router();

router.post('/',(req,res) => {
    let username = req.body.username;
    let password = req.body.password;
    let email = req.body.email;
    res.redirect('./login');
});
module.exports = router;