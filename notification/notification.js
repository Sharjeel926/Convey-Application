const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccKeyMain.json");
// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
// Function to send a message
async function sendNotification(token, title, body) {
  const message = {
    notification: {
      title: title,
      body: body,
    },
    token: token,
  };
  try {
    const response = await admin.messaging().send(message);
    console.log(response);
    return { success: true };
  } catch (error) {
    console.log(error.message);
    return { error: error };
  }
}
module.exports = {
  sendNotification,
};
