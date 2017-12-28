const express = require("express");
const router = express.Router();
const firebase = require("../firebase");
const multer = require("multer");
let upload = multer({ dest: "uploads/" });
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
      date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
    returnPosts.push(post);
  });
  res.render("posts/post", { posts: returnPosts });
});
router.get("/:id", async (req, res) => {
  if (!req.session || (req.session && !req.session.user)) {
    res.redirect("/login");
    return;
  }
  let postId = req.params.id;
  if (postId == "add") {
    let post = { description: "", comments: [] };
    let user = {
      name: "admin",
      email: "admin@pikerfree.com",
      avatarLink: "/firebase/userImages/default_profile.jpg"
    };
    let users = await firebase.getAllUsers();
    res.render("posts/details", {
      post: post,
      user: user,
      users: users,
      postImages: [],
      type: "add"
    });
    return;
  }

  if (postId.indexOf("add&") > -1) {
    let userId = postId.substring(4);
    let user = await firebase.getUser(userId);
    if (!user) {
      user = {
        name: "admin",
        email: "admin@pikerfree.com",
        avatarLink: "/firebase/userImages/default_profile.jpg"
      };
    }
    let post = { description: "", comments: [] };
    res.render("posts/details", {
      post: post,
      user: user,
      users: undefined,
      postImages: [],
      type: "add"
    });
    return;
  }

  if (postId.indexOf("deletePost") > -1) {
    firebase.removePost(postId.replace("deletePost", ""));
    firebase.removePostImage(postId.replace("deletePost", ""));
    res.redirect("/posts");
    return;
  } else {
    let post = await firebase.getPost(postId);
    let user = await firebase.getUser(post.ownerId);
    if (!user) {
      user = {
        name: "admin",
        email: "admin@pikerfree.com",
        avatarLink: "/firebase/userImages/default_profile.jpg"
      };
    }
    if (post.comments) {
      post.comments = post.comments.filter(function(n) {
        return n != undefined;
      });
      for (let index = 0; index < post.comments.length; index++) {
        let comment = post.comments[index];
        if (comment) {
          comment["no"] = index;
          comment["user"] = await firebase.getUser(comment.idUser);
        }
      }
    } else {
      post["comments"] = [];
    }

    let postImages = await firebase.getAllPostImageLink(postId);
    res.render("posts/details", {
      post: post,
      user: user,
      postImages: postImages,
      type: "edit"
    });
  }
});

router.post(
  "/",
  upload.fields([{ name: "postImages", maxCount: 20 }]),
  async (req, res) => {
    if (!req.session || (req.session && !req.session.user)) {
      res.redirect("/login");
      return;
    }
    let post = req.body;
    let postImages = req.files.postImages;
    let deleteMediaStr = post.deleteMedia;
    delete post.deleteMedia;
    if (post.type == "add") {
      delete post.type;
      post["comments"] = [];
      post["location"] = {};
      post["status"] = 1;
      post["timePosted"] = new Date().getTime();
      // post["ownerId"] = "admin";
      post["requestingUser"] = [];
      /** get last id of posts */
      let posts = await firebase.getAllPost();
      if (posts) {
        post["postId"] = posts[posts.length - 1].postId + 1;
      } else {
        post["postId"] = 1;
      }
      firebase.addPost(post);
    } else {
      firebase.updatePost(post);
      /** remove images */
    }
    if (postImages) {
      postImages.forEach(image => {
        firebase.uploadImage(
          image.path,
          "postImages/" + post.postId + "/" + image.originalname
        );
      });
    }
    if (deleteMediaStr != "") {
      let deleteMedia = deleteMediaStr.substring(1).split(",");
      deleteMedia.forEach(image => {
        firebase.deleteImage(image);
      });
    }
    res.redirect("/posts");
  }
);
module.exports = router;
