var admin = require('firebase-admin');
var fs = require('fs');

var serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://pikerfree.firebaseio.com',
  storageBucket: 'pikerfree.appspot.com'
});
const db = admin.database();
const storage = admin.storage();

const getAllUsers = async() => {
  let ref = db.ref('users');
  return new Promise((resolve, reject) => {
    ref.on(
      'value',
      snapshot => {
        resolve(convertObjectToArray(snapshot.val()));
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
    db
      .ref('users')
      .orderByChild('name')
      .equalTo(username)
      .on(
        'value',
        snapshot => {
          let user = snapshot.val();
          resolve(user[Object.keys(user)[0]]);
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
        let returnPosts = [];
        let posts = convertObjectToArray(snapshot.val());
        posts.forEach(post => {
          if (post.ownerId == userId) {
            post['shortContent'] = post.description.substring(0, 20) + '...';
            returnPosts.push(post);
          }
        });
        resolve(returnPosts);
      },
      err => {
        reject(err);
      });
  });
};
const addUser = async user => {
  let password = user.password;
  delete user.password;
  db
    .ref('users')
    .child(user.id)
    .set(user);
  admin.auth().createUser({
    uid: user.id,
    email: user.email,
    password: password,
    displayName: user.name
  });
};
const updateUser = user => {
  if (user.password != "") {
    admin.auth().updateUser(user.id, {
      displayName: user.name,
      password: user.password
    });
  } else {
    admin.auth().updateUser(user.id, {
      displayName: user.name
    });
  }

  db
    .ref('users')
    .child(user.id)
    .update({
      name: user.name,
      phoneNumber: user.phoneNumber,
      address: user.address,
      avatarLink: user.avatarLink,
      rating: user.rating
    });
};
const removeUser = async user => {
  // remove user's post
  if (user.posts) {
    user.posts.forEach(postId => {
      removePost(user.id, postId);
    });
  }
  if (user.mess) {
    for (let i = 0; i < user.mess.length; i++) {
      let conversation = await getConversation(user.mess[i])
      deleteConversation(conversation);
    }
  }
  // remove post comment
  let posts = await getAllPost();
  posts.forEach(post => {
    if (post.comments) {
      post.comments = post.comments.filter(n => {
        return n.idUser != user.id;
      });
      db.ref('posts').child(post.postId).child('comments').set(post.comments);
    }
  });
  // delete following users
  let users = await getAllUsers();
  users.forEach(ur => {
    if (ur.followingUsers) {
      ur.followingUsers = ur.followingUsers.filter(follow => {
        return follow != user.id;
      });
      db.ref('users').child(ur.id).child('followingUsers').set(ur.followingUsers);
    }
    // delete rating user
    if (ur.ratedUsers) {
      ur.ratedUsers = ur.ratedUsers.filter(rated => {
        return rated != user.id;
      });
      db.ref('users').child(ur.id).child('ratedUsers').set(ur.ratedUsers);
    }
  });
  admin.auth().deleteUser(user.id);
  db
    .ref('users')
    .child(user.id)
    .remove();
};

const getAllPost = () => {
  let ref = db.ref('posts');
  return new Promise((resolve, reject) => {
    ref.on(
      'value',
      snapshot => {
        if (snapshot.val()) {
          resolve(convertObjectToArray(snapshot.val()));
        } else {
          resolve([]);
        }
      },
      err => {
        reject(err);
        console.log(err);
      }
    );
  });
};
const getPost = postId => {
  return new Promise((resolve, reject) => {
    db
      .ref('posts')
      .orderByChild('postId')
      .equalTo(postId)
      .on(
        'value',
        snapshot => {
          let post = snapshot.val();
          if (post) {
            resolve(post[Object.keys(post)[0]]);
          } else {
            resolve(undefined);
          }
        },
        err => {
          reject(err);
          console.log(err);
        }
      );
  });
};
const getPostCount = () => {
  return new Promise((resolve, reject) => {
    db
      .ref('postCount')
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
}
// const addPost = async post => {
//   let posts = await getAllPost();
//   posts.push(post);
//   db.ref('posts').set(posts);
//   updateUserPost(post.ownerId, post.postId);
//   updatePostCount(post.postId);
// };
const addPost = post => {
  updateUserPost(post.ownerId, post.postId)
  db
    .ref('posts')
    .child(post.postId)
    .set(post);
  updatePostCount(post.postId)
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
const updatePostCount = postCount => {
  db
    .ref('postCount')
    .set(postCount)
}
const updateUserPost = async(userId, postId) => {
  let user = await getUser(userId);
  if (user && user.posts) {
    user.posts.push(postId);
    db.ref('users').child(userId).child('posts').set(user.posts);
  } else {
    db.ref('users').child(userId).child('posts').set([postId])
  }

}
const removeUserPost = (userId, postId) => {
  db.ref('users').child(userId).child('posts').on('value', snapshot => {
    let posts = snapshot.val();
    if (posts) {
      posts = posts.filter(function (item) {
        return item !== postId
      })
      db.ref('users').child(userId).child('posts').set(posts);
    }
  })
}
// const removePost = async(userId, postId) => {
//   removeUserPost(userId, postId);
//   let posts = await getAllPost();
//   posts = posts.filter(item => {
//     return item && item.postId != postId;
//   });
//   db.ref('posts').set(posts);
// };
const removePost = (userId, postId) => {
  removeUserPost(userId, postId);
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
            (file.metadata.contentType == 'image/jpeg' ||
              file.metadata.contentType == 'image/png')
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
    .upload(filePath, {
      destination: dest
    })
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
            returnFiles.push({
              imageLink: fileLink,
              imageName: file.name
            });
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
          let tempCategory = categoriesCount.find(ob => ob.id == post.category);
          if (tempCategory) {
            tempCategory.postCount++;
          } else {
            categoriesCount.push({
              id: post.category,
              postCount: 1
            });
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
    db.ref('conversations').on(
      'value',
      snapshot => {
        if (snapshot.val()) {
          resolve(snapshot.val());
        } else {
          resolve({});
        }
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
const addMsgToConversation = (msg, conversationId) => {
  db
    .ref('conversations')
    .child(conversationId)
    .child('mess')
    .child(msg.id)
    .set(msg);
  db
    .ref('conversations')
    .child(conversationId)
    .update({
      lastUser1Mess: msg.id,
      lastMessId: msg.id,
      lastMessTime: msg.time
    });
}
const getConversationBetween2User = (user1Id, user2Id) => {
  return new Promise((resolve, reject) => {
    db
      .ref('conversations')
      .on(
        'value',
        snapshot => {
          let conversations = snapshot.val();
          let conversation;
          if (conversations) {
            Object.keys(conversations).forEach(key => {
              if (conversations[key].idUser1 == user1Id && conversations[key].idUser2 == user2Id) {
                conversation = conversations[key];
                return;
              }
            })
          }
          resolve(conversation);
        },
        err => {
          reject(err);
          console.log(err);
        }
      );
  });
}
const addConversation = async conversation => {
  db
    .ref('conversations')
    .child(conversation.conversationId)
    .set(conversation)
  let user = await getUser(conversation.idUser2);
  if (user.mess) {
    user.mess.push(conversation.conversationId);
    db.ref('users').child(user.id).child('mess').set(user.mess);
  } else {
    db.ref('users').child(user.id).child('mess').set([conversation.conversationId]);
  }
  user = await getUser(conversation.idUser1);
  if (user.mess) {
    user.mess.push(conversation.conversationId);
    db.ref('users').child(user.id).child('mess').set(user.mess);
  } else {
    db.ref('users').child(user.id).child('mess').set([conversation.conversationId]);
  }
}
const deleteConversation = async(conversation) => {
  db
    .ref('conversations')
    .child(conversation.conversationId)
    .remove();
  let user = await getUser(conversation.idUser2);
  if (user && user.mess) {
    user.mess = user.mess.filter(function (item) {
      return item !== conversation.conversationId
    })
    db.ref('users').child(user.id).child('mess').set(user.mess);
  }
  user = await getUser(conversation.idUser1);
  if (user && user.mess) {
    user.mess = user.mess.filter(function (item) {
      return item !== conversation.conversationId
    })
    db.ref('users').child(user.id).child('mess').set(user.mess);
  }
}
const convertObjectToArray = object => {
  let array = [];
  if (!Array.isArray(object)) {
    Object.keys(object).forEach(function (key) {
      if (object[key] != undefined) {
        array.push(object[key]);
      }
    }, this);

  } else {
    array = object.filter(item => {
      return item !== undefined;
    });
  }
  return array;
}
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
  getAllPostImageLink,
  getPost,
  updatePost,
  removePost,
  addPost,
  getPostCount,
  getAllCategoryCount,
  getAllPostsOfCategory,
  getAllConversations,
  getConversation,
  addMsgToConversation,
  addConversation,
  getConversationBetween2User,
  deleteConversation,
  deleteImage,
  uploadImage,
  removePostImage
};