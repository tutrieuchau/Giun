const express = require("express");
const router = express.Router();
const firebase = require("../firebase");
router.get("/", (req, res) => {
  res.render("login");
});
router.post("/", async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  let users = await firebase.getAllUsers();
  let admin = undefined;
  if (users) {
    Object.keys(users).forEach(function(key) {
      let user = users[key];
      if(user.name ==='admin'){
          admin = user;
          return;
      }
    }, this);
  }
  if (admin && password === "password") {
    req.session.user = username;
    res.redirect("/dashboard");
  } else {
    res.render("login", { error: "Invalid username or password" });
  }
});
module.exports = router;
