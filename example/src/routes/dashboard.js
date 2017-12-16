const express = require('express');
const router = express.Router();
router.get('/', (req, res) => {
    if(req.session && req.session.user){
        if(req.session.user == 'admin'){
            var user = {name:'',email:'',slogan:'',address:'',phoneNo:''}
            res.render('profile',{user:user,type:'add'});
        }else{
            req.redirect('/login'); 
        }
        
    }else{
        res.redirect('/login');
    }
    

});
module.exports = router;