var admin = require("firebase-admin");
const path = require("path");
var fs = require('fs');

var serviceAccount = require("../../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://pikerfree.firebaseio.com",
  storageBucket: "pikerfree.appspot.com"
});
const db = admin.database();
const storage = admin.storage();

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
/* ****************** */
/** Firebase Storage */
const getAllUsersImage = () => {
  return new Promise((resolve, reject) => {
    storage
      .bucket()
      .getFiles()
      .then(results => {
        const allFiles = results[0];
        let returnFiles = [];
        allFiles.forEach(file => {
          if (
            file.name.includes("userImages") &&
            (file.metadata.contentType == "image/jpeg" ||
              file.metadata.contentType == "image/png")
          ) {
            returnFiles.push(file);
          }
        });
        resolve(returnFiles);
      });
  });
};

const getUserAvatar = avatarId => {
  const options = {
    destination: path.join(__dirname, "../assets/firebase/", avatarId)
  };
  return new Promise((resolve, reject) => {
    storage
      .bucket()
      .file(avatarId)
      .download(options)
      .then(() => {
        console.log("download file:" + avatarId + " complete");
        resolve();
      });
  });
};

const getAllPostImage = postId => {
  let postImgFolder = path.join(__dirname,"../assets/firebase/postImages/",postId);
  try {
    fs.statSync(postImgFolder);
  } catch(e) {
    fs.mkdirSync(postImgFolder);
  }
  return new Promise((resolve, reject) => {
    storage
      .bucket()
      .getFiles()
      .then( async results => {
        const allFiles = results[0];
        let returnFiles = [];
        for(let index = 0; index < allFiles.length;index ++){
          let file = allFiles[index];
          if (
            file.name.includes("postImages/" + postId) &&
            (file.metadata.contentType == "image/jpeg" ||
              file.metadata.contentType == "image/png")
          ) {
            returnFiles.push(file.name);
            await downloadPostImage(file.name);
          }
        }
        resolve(returnFiles);
      });
  });
};
const downloadPostImage = (imageName) => {
  const options = {
    destination: path.join(__dirname, "../assets/firebase/", imageName)
  };
  return new Promise((resolve, reject) => {
    storage
      .bucket()
      .file(imageName)
      .download(options)
      .then(() => {
        console.log("download file:" + imageName + " complete");
        resolve();
      });
  });
}

module.exports = {
  getAllUsers,
  getAllUsersImage,
  getUser,
  addUser,
  updateUser,
  removeUser,
  getUserAvatar,
  getAllUserPosts,
  getAllPost,
  getAllPostImage,
  getPost,
  downloadPostImage
};
