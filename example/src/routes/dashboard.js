const express = require("express");
const router = express.Router();
const firebase = require("../firebase");
const CATEGORY = [
  "ACCESSORIES",
  "BABY AND TOYS",
  "CLOTHS",
  "ELECTRONICS",
  "GROCERIES",
  "HOME AND LIVING",
  "PETS",
  "OTHERS"
];
router.get("/", async (req, res) => {
  /** check login */
  if (!req.session || (req.session && !req.session.user)) {
    res.redirect("/login");
    return;
  }

  let posts = await firebase.getAllPost();
  let users = await firebase.getAllUsers();
  let returnPosts = [];
  /** remote undefine object */
  posts.forEach(post => {
    let authorOb = users[post.ownerId];
    post.category = CATEGORY[post.category - 1];
    post["author"] = authorOb ? authorOb.name : "Admin";
    post["shortContent"] = post.description.substring(0, 30) + "...";

    /** Convert timestamp to date */
    let date = new Date(post.timePosted);
    post["date"] =
      date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear();
    let today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date > today) {
      returnPosts.push(post);
    }
  });
  res.render("home/home", { posts: returnPosts });
});
module.exports = router;
