const express = require('express');
const router = express.Router();
const firebase = require('../firebase');
const CATEGORY = ['ACCESSORIES','BABY AND TOYS','CLOTHS','ELECTRONICS','GROCERIES','HOME AND LIVING','PETS','OTHERS'];
router.get('/', async (req, res) => {
   /** check login */
   if (!req.session || (req.session && !req.session.user)) {
    res.redirect('/login');
    return;
  }
  let categoriesCount = await firebase.getAllCategoryCount();
  let categories = [
    { id: 1, name: 'ACCESSORIES' },
    { id: 2, name: 'BABY AND TOYS' },
    { id: 3, name: 'CLOTHS' },
    { id: 4, name: 'ELECTRONICS' },
    { id: 5, name: 'GROCERIES' },
    { id: 6, name: 'HOME AND LIVING' },
    { id: 7, name: 'PETS' },
    { id: 8, name: 'OTHERS' }
  ];
  categories.forEach(category => {
    let tempCategory = categoriesCount.find(ob => ob.id == category.id);
    category['postCount'] = tempCategory ? tempCategory.postCount : 0;
  });
  res.render('category/category', { categories: categories, admin: req.session.user });
});
router.get('/:id', async (req, res) => {
    let categoryId = req.params.id;
    let posts = await firebase.getAllPostsOfCategory(parseInt(categoryId));
    if(posts){
        for(let index = 0; index < posts.length; index ++){
            let post = posts[index];
            post.category = CATEGORY[post.category-1];
            let user = await firebase.getUser(post.ownerId);
            post['author'] = user? user.name : 'Admin';
            post['shortContent'] = post.description.substring(0,30) + '...';
            /** Convert timestamp to date */
            let date = new Date(post.timePosted);
            post['date'] = date.getDate() + '/' + date.getMonth() + '/' + date.getFullYear();
        }
    }
    res.render('posts/post',{ posts: posts, admin: req.session.user });

});
module.exports = router;
