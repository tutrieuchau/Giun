var admin = require("firebase-admin");

var serviceAccount = require("../../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fir-54451.firebaseio.com"
});
const db = admin.database();
const getAllFireBaseData = () => {
  // let ref = db.ref("server/saving-data/fireblog");
  let ref = db.ref("users");
  var usersRef = ref.child('users');
  // Attach an asynchronous callback to read the data at our posts reference
  ref.on("value", function (snapshot) {
    console.log(snapshot.val());
  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
  });
}
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
module.exports = {
  getAllFireBaseData,
  getAllUsers
};