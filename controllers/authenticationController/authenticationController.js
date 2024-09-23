const userModel = require("../../models/userModel");
const otpModel = require("../../models/otpModel");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { generateOtp } = require("../../utils/generateOtp");
const sendVerificationEmail = require("../../utils/sendEmail");
const bcrypt = require("bcrypt");
const secretKey = require("../../config/config");

const { OAuth2Client } = require("google-auth-library");
const signUp = async (req, res) => {
  try {
    const {
      email,
      userName,
      password,
      confirmPass,
      userType,
      HomeAddress,
      deliveryAddress,
      preferredDeliveryArea,
      preferredTimeSlot,
      startDate,
      registrationToken,
    } = req.body;
    const checkUser = await userModel.findOne({ email: email });
    if (checkUser) {
      if (checkUser.isVerified === true) {
        return res.status(400).json({
          message: `User Already exist on ${checkUser.userType} side`,
        });
      } else {
        await otpModel.deleteOne({ email: email });
        const otp = generateOtp();
        const newVerify = new otpModel({
          otp: otp,
          email: email,
        });
        await newVerify.save();
        sendVerificationEmail(email, otp);
        return res.status(201).json({
          message: "User registered but not verified",
          //  userInfo: checkUser,
          userInfo: {
            userId: checkUser._id,
            userName: checkUser.userName,
            email: checkUser.email,
            profilePic: checkUser.profilePic,
            isVerified: checkUser.isVerified,
            phoneNumber: checkUser.phoneNumber,
            deliveryAddress: checkUser.deliveryAddress,
            userType: checkUser.userType,
            userAccountType: checkUser.userAccountType,
          },
          Otp: otp,
        });
      }
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const newUser = new userModel({
      userName: userName,
      email: email,
      password: hashPassword,
      userType: userType,
      isVerified: false,
      deliveryAddress: deliveryAddress,
      HomeAddress: HomeAddress,
      preferredDeliveryArea: preferredDeliveryArea,
      preferredTimeSlot: preferredTimeSlot,
      startDate: startDate,
      registrationToken: registrationToken,
    });
    await newUser.save();
    const newOtp = new otpModel({
      otp: otp,
      email: email,
    });
    await newOtp.save();
    sendVerificationEmail(email, otp);
    return res.status(201).json({
      message: "User registered successfully",
      // userInfo: newUser,
      userInfo: {
        userId: newUser._id,
        userName: newUser.userName,
        email: newUser.email,
        profilePic: newUser.profilePic,
        isVerified: newUser.isVerified,
        phoneNumber: newUser.phoneNumber,
        deliveryAddress: newUser.deliveryAddress,
        userType: newUser.userType,
        userAccountType: newUser.userAccountType,
        HomeAddress: newUser.HomeAddress,
        preferredDeliveryArea: newUser.preferredDeliveryArea,
        preferredTimeSlot: newUser.preferredTimeSlot,
        startDate: newUser.startDate,
      },
      Otp: otp,
    });
  } catch (error) {
    return res.status(503).json({ error: error.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const find = await userModel.findById(userId);
    if (!find) {
      return res.status(401).json({ message: "User not found" });
    } else {
      const email = find.email;
      const checkOtp = await otpModel.findOne({ email });
      if (checkOtp) {
        if (checkOtp.otp === otp) {
          const upadteUser = await userModel.updateOne(
            {
              email: find.email,
              isVerified: false,
            },
            {
              $set: { isVerified: true },
            }
          );
          const token = jwt.sign(
            {
              userId: find._id,
            },
            secretKey.secretKey,
            {
              expiresIn: "30d",
            }
          );
          const userInfo = {
            userId: find._id,
            userName: find.userName,
            email: find.email,
            profilePic: find.profilePic,
            isVerified: find.isVerified,
            phoneNumber: find.phoneNumber,
            deliveryAddress: find.deliveryAddress,
            userType: find.userType,
            userAccountType: find.userAccountType,
            HomeAddress: find.HomeAddress,
            preferredDeliveryArea: find.preferredDeliveryArea,
            preferredTimeSlot: find.preferredTimeSlot,
            startDate: find.startDate,
          };

          return res.status(200).json({
            message: "User is verified",
            userInfo,
            token: token,
          });
        } else {
          return res.status(401).json({ message: "otp is not correct" });
        }
      } else {
        return res
          .status(403)
          .json({ message: "Otp not found. Please resend Otp" });
      }
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const forgot = async (req, res) => {
  try {
    const { email } = req.body;
    const errors = validationResult(req);
    const findUser = await userModel.findOne({ email });
    if (!findUser) {
      return res.status(401).json({ message: "User not found" });
    }
    const Otp = generateOtp();
    sendVerificationEmail(email, Otp);
    const newOtp = new otpModel({
      otp: Otp,
      email: email,
    });
    await newOtp.save();
    res.status(200).json({
      message: "Otp is sending to your email",
      userId: findUser._id,
      Otp,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyForgotOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await userModel.findById(userId).select("email");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const checkOtp = await otpModel.findOne({ email: user.email });

    if (checkOtp && checkOtp.otp == otp) {
      //abc
      await otpModel.findByIdAndDelete(checkOtp._id);

      return res
        .status(200)
        .json({ message: "Otp is verified. You can reset your password now." });
    } else {
      //   await otpModel.findByIdAndDelete(checkOtp._id);
      return res.status(401).json({ message: "Wrong or expired Otp" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const newPassword = async (req, res) => {
  try {
    const { userId, password, newPassword } = req.body;
    const checkUser = await userModel.findOne({ _id: userId });
    if (!checkUser) {
      return res.status(403).json({
        message: "User not registered. Enter the user Id of registered user",
      });
    }

    if (password !== newPassword) {
      return res.status(401).json({ message: "Password is not match" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await userModel.updateOne(
      { _id: userId },
      { $set: { password: hashedPassword } }
    );

    if (!result) {
      return res.status(400).json({ message: "Invalid user or password" });
    }

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    // console.error("Error updating password:", error);
    res.status(500).json({ message: error.message });
  }
};
/*/
const login = async (req, res) => {
  try {
    const { email, password, registrationToken, userType } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const check = await userModel.findOne({ email: email.toLowerCase() });
    if (check.userType === "Admin" || check.userType === "superAdmin") {
      check.registrationToken = registrationToken;
      await check.save();

      const token = jwt.sign(
        {
          userId: check._id,
        },
        secretKey.secretKey,
        {
          expiresIn: "30d",
        }
      );

      return res.status(200).json({
        message: "Login successfully",
        token: token,

        userInfo: {
          userId: check._id,
          userName: check.userName,
          email: check.email,
          isVerified: check.isVerified,
          phoneNumber: check.phoneNumber,
          deliveryAddress: check.deliveryAddress,
          userType: check.userType,
          userAccountType: check.userAccountType,
          profilePic: check.profilePic,
          HomeAddress: check.HomeAddress,
          preferredDeliveryArea: check.preferredDeliveryArea,
          preferredTimeSlot: check.preferredTimeSlot,
          startDate: check.startDate,
        },
      });
    }

    if (check.userType !== userType) {
      return res
        .status(403)
        .json({ message: `You are already registered as ${check.userType}` });
    }
    if (!check) {
      return res.status(401).json({ message: "User not found" });
    }
    // console.log(check.password);
    // const hashPass = await bcrypt.hash(password, 10);
    // console.log(hashPass);
    const checkPass = await bcrypt.compare(password, check.password);

    if (!checkPass) {
      return res.status(403).json({ message: "Incorrect password" });
    }

    /*/
/*/if (!check.isVerified) {
  return res.status(401).json({ message: "User Not verified" });
}/*/
/*/
    if (registrationToken) {
      check.registrationToken = registrationToken;
      await check.save();
    }

    const token = jwt.sign(
      {
        userId: check._id,
      },
      secretKey.secretKey,
      {
        expiresIn: "30d",
      }
    );
    //abc
    return res.status(200).json({
      message: "Login successfully",
      token: token,

      userInfo: {
        userId: check._id,
        userName: check.userName,
        email: check.email,
        isVerified: check.isVerified,
        phoneNumber: check.phoneNumber,
        deliveryAddress: check.deliveryAddress,
        userType: check.userType,
        userAccountType: check.userAccountType,
        profilePic: check.profilePic,
        location: check.location,
        HomeAddress: check.HomeAddress,
        preferredDeliveryArea: check.preferredDeliveryArea,
        preferredTimeSlot: check.preferredTimeSlot,
        startDate: check.startDate,
      },
    });
  } catch (error) {
    // console.error("Error during login:", error);
    return res.status(500).json({ message: error.message });
  }
};/*/
const login = async (req, res) => {
  try {
    const { email, password, registrationToken, userType } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Find the user by email
    const check = await userModel.findOne({ email: email.toLowerCase() });

    // Ensure the user exists
    if (!check) {
      return res.status(401).json({ message: "User not found" });
    }

    // Ensure that userType matches
    if (check.userType !== userType) {
      return res.status(403).json({
        message: `You are already registered as ${check.userType}`,
      });
    }

    console.log("password", password);
    console.log("check pass", check.password);
    // Compare the passwords
    const checkPass = await bcrypt.compare(password, check.password);

    if (!checkPass) {
      return res.status(403).json({ message: "Incorrect password" });
    }

    // Handle registration token and token generation for Admin or superAdmin
    if (check.userType === "Admin" || check.userType === "superAdmin") {
      check.registrationToken = registrationToken;
      await check.save();

      const token = jwt.sign({ userId: check._id }, secretKey.secretKey, {
        expiresIn: "30d",
      });

      return res.status(200).json({
        message: "Login successfully",
        token: token,
        userInfo: {
          userId: check._id,
          userName: check.userName,
          email: check.email,
          isVerified: check.isVerified,
          phoneNumber: check.phoneNumber,
          deliveryAddress: check.deliveryAddress,
          userType: check.userType,
          userAccountType: check.userAccountType,
          profilePic: check.profilePic,
          HomeAddress: check.HomeAddress,
          preferredDeliveryArea: check.preferredDeliveryArea,
          preferredTimeSlot: check.preferredTimeSlot,
          startDate: check.startDate,
        },
      });
    }

    // If registrationToken is provided, save it
    if (registrationToken) {
      check.registrationToken = registrationToken;
      await check.save();
    }

    // Generate JWT token
    const token = jwt.sign({ userId: check._id }, secretKey.secretKey, {
      expiresIn: "30d",
    });

    return res.status(200).json({
      message: "Login successfully",
      token: token,
      userInfo: {
        userId: check._id,
        userName: check.userName,
        email: check.email,
        isVerified: check.isVerified,
        phoneNumber: check.phoneNumber,
        deliveryAddress: check.deliveryAddress,
        userType: check.userType,
        userAccountType: check.userAccountType,
        profilePic: check.profilePic,
        HomeAddress: check.HomeAddress,
        preferredDeliveryArea: check.preferredDeliveryArea,
        preferredTimeSlot: check.preferredTimeSlot,
        startDate: check.startDate,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const loginWithGoogle = async (req, res) => {
  const { idToken, registrationToken, userType } = req.body; /*/
  userType: {
      type: String,
      enum: ["user", "rider"],
    },
    userAccountType: {
      type: String,
      enum: ["google", "regular"],
    },
  /*/

  const googleClientId = process.env.googleClientId;
  let response;
  const client = new OAuth2Client(googleClientId);

  try {
    response = await client.verifyIdToken({
      idToken,
      audience: googleClientId,
    });
    const expirationTimeStamp = response.payload.exp;
    const currentTimestamp = Math.floor(Date.now() / 1000);

    if (currentTimestamp > expirationTimeStamp) {
      return res.status(403).json({ message: "Token expired" });
    }

    const { email, name, picture, phone, email_verified } = response.payload;
    let token;
    let user = await userModel.findOne({ email: email });
    if (!user) {
      const newUser = new userModel({
        userName: name,
        email: email,
        profilePic: picture,

        registrationToken: registrationToken,
        userType: userType,
        userAccountType: "google",
        isVerified: true,
      });
      await newUser.save();
      token = jwt.sign({ userId: newUser._id }, secretKey.secretKey, {
        expiresIn: "30d",
      });

      return res.status(200).json({
        userInfo: {
          userId: newUser._id,
          userName: newUser.userName,
          email: newUser.email,
          profilePic: newUser.profilePic,
          isVerified: newUser.isVerified,
          phoneNumber: newUser.phoneNumber,
          deliveryAddress: newUser.deliveryAddress,
          userType: newUser.userType,
          userAccountType: newUser.userAccountType,
          location: newUser.location,
          HomeAddress: newUser.HomeAddress,
          preferredDeliveryArea: newUser.preferredDeliveryArea,
          preferredTimeSlot: newUser.preferredTimeSlot,
          startDate: newUser.startDate,
        },
        token: token,
        message: "Successfully registered with google",
      });
    } else {
      if (user.userType !== userType) {
        return res
          .status(403)
          .json({ message: `You are already registered on ${user.userType}` });
      }

      user.registrationToken = registrationToken;
      await user.save();
      token = jwt.sign(
        {
          userId: user._id,
        },
        secretKey.secretKey,
        { expiresIn: "30d" }
      );

      return res.status(200).json({
        userInfo: {
          userId: user._id,
          userName: user.userName,
          email: user.email,
          profilePic: user.profilePic,
          isVerified: user.isVerified,
          phoneNumber: user.phoneNumber,
          deliveryAddress: user.deliveryAddress,
          userType: user.userType,
          userAccountType: user.userAccountType,
          location: user.location,
          HomeAddress: user.HomeAddress,
          preferredDeliveryArea: user.preferredDeliveryArea,
          preferredTimeSlot: user.preferredTimeSlot,
          startDate: user.startDate,
        },
        token: token,
        message: "Successfully login with google",
      });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const addInfo = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }
      const { deliveryAddress, phoneNumber } = req.body;
      const userId = auth.userId;
      const findUser = await userModel.findById(userId);
      if (!findUser) {
        return res.status(404).json({ message: "User not found" });
      }
      findUser.deliveryAddress = deliveryAddress;
      findUser.phoneNumber = phoneNumber;
      await findUser.save();
      return res
        .status(200)
        .json({ message: "Delivery address added successfully" });
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
const updateLocation = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }
      const { location } = req.body;

      const findUser = await userModel.findById(auth.userId);
      if (!findUser) {
        return res.status(404).json({ message: "User not found" });
      }
      findUser.location = location;
      await findUser.save();
      return res.status(200).json({
        userInfo: {
          userId: findUser._id,
          userName: findUser.userName,
          email: findUser.email,
          isVerified: findUser.isVerified,
          phoneNumber: findUser.phoneNumber,
          deliveryAddress: findUser.deliveryAddress,
          userType: findUser.userType,
          userAccountType: findUser.userAccountType,
          profilePic: findUser.profilePic,
          location: findUser.location,
          HomeAddress: findUser.HomeAddress,
          preferredDeliveryArea: findUser.preferredDeliveryArea,
          preferredTimeSlot: findUser.preferredTimeSlot,
          startDate: findUser.startDate,
        },
      });
    });
  } catch (error) {
    return res.status(500).json({ error: error });
  }
};
const logOut = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ message: "Invalid token", error: err });
      }

      const findUser = await userModel.findById(auth.userId);
      if (!findUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Clear registration token and save
      findUser.registrationToken = "";
      await findUser.save();

      // Send success response
      return res.status(200).json({ message: "Logged out successfully" });
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
module.exports = {
  signUp,
  verifyOtp,
  forgot,
  verifyForgotOtp,
  newPassword,
  login,
  loginWithGoogle,
  addInfo,
  updateLocation,
  logOut,
};
