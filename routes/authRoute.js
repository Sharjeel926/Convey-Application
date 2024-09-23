const express = require("express");
const router = express.Router();
const authCon = require("../controllers/authenticationController/authenticationController");
const verifyToken = require("../middleware/verifyToken");
router.post("/signUp", authCon.signUp);
router.post("/verifyOtp", authCon.verifyOtp);
router.post("/forgot", authCon.forgot);
router.post("/verifyForgotOtp", authCon.verifyForgotOtp);
router.put("/newPassword", authCon.newPassword);
router.post("/login", authCon.login);
router.post("/appleLogin", authCon.loginWithGoogle);
router.put("/updateLocation", verifyToken, authCon.updateLocation);
router.post("/logOut", verifyToken, authCon.logOut);
module.exports = router;
//abc
