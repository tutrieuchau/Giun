var admin = require("firebase-admin");
const path = require("path");
var fs = require("fs");

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
        async snapshot => {
          let user = snapshot.val();
          if(user){
            user.avatarLink = await getUserAvatarLink(user.avatarLink);
          }
          resolve(user);
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
        if (!snapshot.val()) {
          resolve(posts);
          return;
        }
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
        resolve(true);
      })
      .catch(error => {
        console.log("file not exit");
        resolve(false);
      });
  });
};

const getUserAvatarLink = avatarId => {
  return new Promise((resolve, reject) => {
    storage
      .bucket()
      .file(avatarId)
      .getSignedUrl({
        action: "read",
        expires: "03-09-2491"
      })
      .then(signedUrls => {
        console.log(signedUrls[0]);
        resolve(signedUrls[0]);
      })
      .catch(error => {
        reject(error);
      });
  });
};
const uploadAvatarLink = () => {
  // store.bucket().fia
};

const getAllPostImage = postId => {
  let postImgFolder = path.join(
    __dirname,
    "../assets/firebase/postImages/",
    postId
  );
  try {
    fs.statSync(postImgFolder);
  } catch (e) {
    fs.mkdirSync(postImgFolder);
  }
  return new Promise((resolve, reject) => {
    storage
      .bucket()
      .getFiles()
      .then(async results => {
        const allFiles = results[0];
        let returnFiles = [];
        for (let index = 0; index < allFiles.length; index++) {
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

const getAllPostImageLink = postId => {
  return new Promise((resolve, reject) => {
    storage
      .bucket()
      .getFiles()
      .then(async results => {
        const allFiles = results[0];
        let returnFiles = [];
        for (let index = 0; index < allFiles.length; index++) {
          let file = allFiles[index];
          if (
            file.name.includes("postImages/" + postId) &&
            (file.metadata.contentType == "image/jpeg" ||
              file.metadata.contentType == "image/png")
          ) {
            let fileLink = await getPostFileLink(file.name);
            returnFiles.push(fileLink);
          }
        }
        resolve(returnFiles);
      });
  });
};

/** Get link file */
const getPostFileLink = fileName => {
  return new Promise((resolve, reject) => {
    storage
      .bucket()
      .file(fileName)
      .getSignedUrl({
        action: "read",
        expires: "03-09-2491"
      })
      .then(signedUrls => {
        console.log(signedUrls[0]);
        resolve(signedUrls[0]);
      })
      .catch(error => {
        reject(error);
      });
  });
};

const downloadPostImage = imageName => {
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
};

/** Category */
const getAllCategoryCount = () => {
  let categoriesCount = [];
  return new Promise((resolve, reject) => {
    db.ref("posts").on(
      "value",
      snapshot => {
        let posts = snapshot.val();
        if (!posts) {
          resolve(categoriesCount);
          return;
        }
        posts.forEach(post => {
          let tempCategory = categoriesCount.find(ob => ob.id == post.category);
          if (tempCategory) {
            tempCategory.postCount++;
          } else {
            categoriesCount.push({ id: post.category, postCount: 1 });
          }
        });
        resolve(categoriesCount);
      },
      err => {
        reject(err);
        console.log(err);
      }
    );
  });
};

const getAllPostsOfCategory = categoryId => {
  let posts = [];
  return new Promise((resolve, reject) => {
    db.ref("posts").on(
      "value",
      snapshot => {
        if (!snapshot.val()) {
          resolve(posts);
          return;
        }
        snapshot.val().forEach(post => {
          if (post.category == categoryId) {
            posts.push(post);
          }
        });
        resolve(posts);
      },
      err => {
        reject(err);
        console.log(err);
      }
    );
  });
};
/** Conversation */
const getAllConversations = () => {
  return new Promise((resolve, reject) => {
    db.ref("conversations").on(
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
const getConversation = conversationId => {
  return new Promise((resolve, reject) => {
    db
      .ref("conversations")
      .child(conversationId)
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
  getAllUsersImage,
  getUser,
  addUser,
  updateUser,
  removeUser,
  getUserAvatar,
  getUserAvatarLink,
  getAllUserPosts,
  getAllPost,
  getAllPostImage,
  getAllPostImageLink,
  getPost,
  downloadPostImage,
  getAllCategoryCount,
  getAllPostsOfCategory,
  getAllConversations,
  getConversation
};
