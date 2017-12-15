var admin = require("firebase-admin");

var serviceAccount = require("../../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://pikerfree.firebaseio.com"
});
const db = admin.database();
const getAllUsers = async () => {
  let ref = db.ref("users");
  return new Promise((resolve,reject) => {
    ref.on('value', snapshot => {
        resolve(snapshot.val() );
        console.log(snapshot.val());
    }, err => {
      reject( err );
    } );
  });
}
const addUser = (user) => {
  db.ref("users").child(user.id).set(user);
}
const updateUser = (user) => {
  db.ref("users").child(user.id).update({
    'name':user.name,
    'email':user.email,
    'phoneNumber':user.phoneNumber,
    'slogan':user.slogan,
    'address':user.address
  });
}
const removeUser = (userId) =>{
  db.ref("users").child(userId).remove();
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
  getAllPost,
  addUser,
  updateUser,
  removeUser
};