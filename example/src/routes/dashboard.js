const express = require('express');
const router = express.Router();
router.get('/', (req, res) => {
    if(req.session && req.session.user){
        if(req.session.user == 'admin'){
            res.render('profile');
        }else{
            req.redirect('/login'); 
        }
        
    }else{
        res.redirect('/login');
    }
    

});
module.exports = router;