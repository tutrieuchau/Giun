var admin = require('firebase-admin');
const path = require('path');
var fs = require('fs');

var serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://pikerfree.firebaseio.com',
  storageBucket: 'pikerfree.appspot.com'
});
const db = admin.database();
const storage = admin.storage();

const getAllUsers = async () => {
  let ref = db.ref('users');
  return new Promise((resolve, reject) => {
    ref.on(
      'value',
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
  return new Promise((resolve, reject) => {
    db
      .ref('users')
      .child(userId)
      .on(
        'value',
        async snapshot => {
          let user = snapshot.val();
          if (user) {
            user['bkAvatarLink'] = user.avatarLink;
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
/** search user by username */
const getUserByUsername = async username => {
  return new Promise((resolve, reject) => {
    db.ref('users').on(
      'value',
      snapshot => {
        if (snapshot) {
          Object.keys(snapshot.val()).forEach( function (key) {
            let user = snapshot.val()[key];
            if (user.name == username) {
              resolve(user);
              return;
            }
          }, this);
        }
      },
      err => {
        reject(err);
      }
    );
  });
}
/** Get User Post By Id */
const getAllUserPosts = async userId => {
  return new Promise((resolve, reject) => {
    db.ref('posts').on(
      'value',
      snapshot => {
        let posts = [];
        if (!snapshot.val()) {
          resolve(posts);
          return;
        }
        snapshot.val().forEach(post => {
          if (post.ownerId === userId) {
            post['shortContent'] = post.description.substring(0, 20) + '...';
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
    .ref('users')
    .child(user.id)
    .set(user);
};
const updateUser = user => {
  db
    .ref('users')
    .child(user.id)
    .update({
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      address: user.address,
      avatarLink: user.avatarLink,
      rating: user.rating
    });
};
const removeUser = userId => {
  db
    .ref('users')
    .child(userId)
    .remove();
};
const getAllPost = () => {
  let ref = db.ref('posts');
  return new Promise((resolve, reject) => {
    ref.on(
      'value',
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
      .ref('posts')
      .child(postID)
      .on(
        'value',
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
const addPost = post => {
  db
    .ref('posts')
    .child(post.postId)
    .set(post);
};
const updatePost = post => {
  db
    .ref('posts')
    .child(post.postId)
    .update({
      title: post.title,
      description: post.description,
      category: parseInt(post.category),
      comments: post.comments,
      location: post.location
    });
};
const removePost = postId => {
  db
    .ref('posts')
    .child(postId)
    .remove();
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
            file.name.includes('userImages') &&
            (file.metadata.contentType === 'image/jpeg' ||
              file.metadata.contentType === 'image/png')
          ) {
            returnFiles.push(file);
          }
        });
        resolve(returnFiles);
      });
  });
};
const getUserAvatarLink = avatarId => {
  return new Promise((resolve, reject) => {
    storage
      .bucket()
      .file(avatarId)
      .getSignedUrl({
        action: 'read',
        expires: '03-09-2491'
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
const uploadImage = (filePath, dest) => {
  storage
    .bucket()
    .upload(filePath, { destination: dest })
    .then(() => {
      fs.unlink(filePath);
    });
};
const deleteImage = imageId => {
  storage
    .bucket()
    .file(imageId)
    .delete();
};

const getAllPostImage = postId => {
  let postImgFolder = path.join(
    __dirname,
    '../assets/firebase/postImages/',
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
          if (file.name.includes('postImages/' + postId)) {
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
          if (file.name.includes('postImages/' + postId)) {
            let fileLink = await getPostFileLink(file.name);
            returnFiles.push({ imageLink: fileLink, imageName: file.name });
          }
        }
        resolve(returnFiles);
      });
  });
};
const removePostImage = postId => {
  storage
    .bucket()
    .getFiles()
    .then(async results => {
      const allFiles = results[0];
      for (let index = 0; index < allFiles.length; index++) {
        let file = allFiles[index];
        if (file.name.includes('postImages/' + postId)) {
          deleteImage(file.name);
        }
      }
    });
};

/** Get link file */
const getPostFileLink = fileName => {
  return new Promise((resolve, reject) => {
    storage
      .bucket()
      .file(fileName)
      .getSignedUrl({
        action: 'read',
        expires: '03-09-2491'
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
    destination: path.join(__dirname, '../assets/firebase/', imageName)
  };
  return new Promise((resolve, reject) => {
    storage
      .bucket()
      .file(imageName)
      .download(options)
      .then(() => {
        console.log('download file:' + imageName + ' complete');
        resolve();
      });
  });
};

/** Category */
const getAllCategoryCount = () => {
  let categoriesCount = [];
  return new Promise((resolve, reject) => {
    db.ref('posts').on(
      'value',
      snapshot => {
        let posts = snapshot.val();
        if (!posts) {
          resolve(categoriesCount);
          return;
        }
        posts.forEach(post => {
          let tempCategory = categoriesCount.find(ob => ob.id === post.category);
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
    db.ref('posts').on(
      'value',
      snapshot => {
        if (!snapshot.val()) {
          resolve(posts);
          return;
        }
        snapshot.val().forEach(post => {
          if (post.category === categoryId) {
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
    db.ref('conversations').on(
      'value',
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
      .ref('conversations')
      .child(conversationId)
      .on(
        'value',
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
  getUserByUsername,
  getUserAvatarLink,
  getAllUserPosts,
  getAllPost,
  getAllPostImage,
  getAllPostImageLink,
  getPost,
  updatePost,
  removePost,
  addPost,
  downloadPostImage,
  getAllCategoryCount,
  getAllPostsOfCategory,
  getAllConversations,
  getConversation,
  deleteImage,
  uploadImage,
  removePostImage
};
