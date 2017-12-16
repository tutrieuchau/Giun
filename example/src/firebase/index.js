var admin = require("firebase-admin");

var serviceAccount = require("../../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://pikerfree.firebaseio.com"
});
const db = admin.database();

const getAllUsers = async () => {
  let ref = db.ref("users");
  return new Promise((resolve, reject) => {
    ref.on(
      "value",
      snapshot => {
        resolve(snapshot.val());
      },
      err => {
        reject(err);
      }
    );
  });
};
/** Get User by Id */
const getUser = async userId => {
  let ref = db.ref("users");
  return new Promise((resolve, reject) => {
    db
      .ref("users")
      .child(userId)
      .on(
        "value",
        snapshot => {
          resolve(snapshot.val());
        },
        err => {
          reject(err);
        }
      );
  });
};
/** Get User Post By Id */
const getAllUserPosts = async userId => {
  return new Promise((resolve, reject) => {
    db.ref("posts").on(
      "value",
      snapshot => {
        let posts = [];
        snapshot.val().forEach(post => {
          if (post.ownerId == userId) {
            post["shortContent"] = post.description.substring(0, 20) + "...";
            posts.push(post);
          }
        });
        resolve(posts);
      },
      err => {
        reject(err);
      }
    );
  });
};
const addUser = user => {
  db
    .ref("users")
    .child(user.id)
    .set(user);
};
const updateUser = user => {
  db
    .ref("users")
    .child(user.id)
    .update({
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      slogan: user.slogan,
      address: user.address
    });
};
const removeUser = userId => {
  db
    .ref("users")
    .child(userId)
    .remove();
};
const getAllPost = () => {
  let ref = db.ref("posts");
  return new Promise((resolve, reject) => {
    ref.on(
      "value",
      snapshot => {
        resolve(snapshot.val());
      },
      err => {
        reject(err);
        console.log(err);
      }
    );
  });
};
const getPost = postID => {
  return new Promise((resolve, reject) => {
    db
      .ref("posts")
      .child(postID)
      .on(
        "value",
        snapshot => {
          resolve(snapshot.val());
        },
        err => {
          reject(err);
          console.log(err);
        }
      );
  });
};

module.exports = {
  getAllUsers,
  getUser,
  addUser,
  updateUser,
  removeUser,
  getAllUserPosts,
  getAllPost,
  getPost
};
