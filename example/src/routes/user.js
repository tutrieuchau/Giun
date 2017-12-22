const express = require("express");
const router = express.Router();
const firebase = require("../firebase");
var randomstring = require("randomstring");
var multer  = require('multer');
var upload = multer();

router.get("/", async (req, res) => {
  /** check login */
  if (!req.session || (req.session && !req.session.user)) {
    res.redirect("/login");
    return;
  }
  firebase.getAllUsersImage();

  let users = await firebase.getAllUsers();
  /** Convert users object to array */
  let userArray = [];
  Object.keys(users).forEach(function(key) {
    userArray.push(users[key]);
  }, this);
  res.render("users/user", { users: userArray });
});
router.get("/:id", async (req, res) => {
  /** check login */
  if (!req.session || (req.session && !req.session.user)) {
    res.redirect("/login");
    return;
  }
  /** Add or Delete User */
  let userId = req.params.id;
  if (userId == "add") {
    let user = {
      name: "",
      email: "",
      slogan: "",
      address: "",
      phoneNo: "",
      avatarLink: "/firebase/userImages/default_profile.jpg"
    };
    res.render("users/profile", { user: user, type: "add", posts: [] });
    return;
  } else if (userId.indexOf("deleteUser") > -1) {
    firebase.removeUser(userId.replace("deleteUser", ""));
    res.redirect("/users");
    return;
  }

  let user = await firebase.getUser(userId);
  let userPosts = await firebase.getAllUserPosts(userId);
  if (!user) {
    res.render("404");
    return;
  } else {
    res.render("users/profile", { user: user, type: "edit", posts: userPosts });
  }
});
//,upload.single('avatar')
router.post("/",upload.single("avatarImages"),async (req, res,next) => {
  /** check login */
  if (!req.session || (req.session && !req.session.user)) {
    res.redirect("/login");
    return;
  }
  var userId = randomstring.generate(28);
  let user = req.body;
  let avatars = req.file;
  if (user.type == "add") {
    user.id = userId;
    user["instanceId"] = userId;
    user["posts"] = [];
    user["isOnline"] = false;
    user["avatarLink"] = "userImages/default_profile.jpg";
    user["rating"] = 0;
    user["mess"] = [];
    user["followingUsers"] = [];
    user["ratedUsers"] = [];
    user["posts"] = [];
    delete user.type;
    firebase.addUser(user);
  } else {
    delete user.type;
    firebase.updateUser(user);
  }
  res.redirect("/users");
  console.log("post");
});
module.exports = router;
