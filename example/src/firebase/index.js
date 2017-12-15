var admin = require("firebase-admin");

var serviceAccount = require("../../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://pikerfree.firebaseio.com"
});
const db = admin.database();
const getAllUsers = async() => {
  let ref = db.ref("users");
  return new Promise((resolve,reject) => {
    ref.on('value', snapshot => {
        resolve(snapshot.val() );
    }, err => {
      reject( err );
    } );
  });
}
const addUser = (user) => {
  var usersRef = ref.child('users');
  usersRef.set(user);
}
const getAllPost = () => {
  let ref = db.ref("posts");
  return new Promise((resolve,reject) => {
    ref.on('value', snapshot => {
        resolve(snapshot.val() );
        console.log(snapshot.val());
    }, err => {
      reject( err );
      console.log(err);
    } );
  });
}
const getUserByUserId = (userId) =>{
  let ref = db.ref("users/"+userId);
  return new Promise((resolve,reject) => {
    ref.once('value', snapshot => {
        resolve(snapshot.val() );
    }, err => {
      reject( err );
    } );
  });
}
module.exports = {
  getAllUsers,
  getUserByUserId,
  getAllPost
};