const express = require('express');
const router = express.Router();
router.get('/',(req,res) => {
    if(req.session) req.session.reset();
    res.redirect('/login');
});
module.exports = router;