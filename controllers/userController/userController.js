const secretKey = require("../../config/config");
const userModel = require("../../models/userModel");
const orderSchema = require("../../models/orderModel");
const tipSchema = require("../../models/tipSchema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const editProfile = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err.message });
      }

      const profilePicUrl = req.profilePicUrl;
      let updatedFields = { ...(req.body || {}) };

      if (profilePicUrl) {
        updatedFields.profilePic = profilePicUrl;
      } else {
        delete updatedFields.profilePicUrl;
      }

      const userId = auth.userId;

      if (updatedFields.password) {
        try {
          const salt = await bcrypt.genSalt(10);
          updatedFields.password = await bcrypt.hash(
            updatedFields.password,
            salt
          );
        } catch (hashError) {
          return res.status(500).json({
            message: "An error occurred while hashing the password",
            details: hashError.message,
          });
        }
      }

      try {
        const findUser = await userModel.findByIdAndUpdate(
          userId,
          { $set: updatedFields },
          { new: true }
        );

        if (!findUser) {
          return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
          message: "Profile updated successfully",
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
            HomeAddress: findUser.HomeAddress,
            preferredDeliveryArea: findUser.preferredDeliveryArea,
            preferredTimeSlot: findUser.preferredTimeSlot,
            startDate: findUser.startDate,
          },
        });
      } catch (updateError) {
        return res.status(500).json({
          message: "An error occurred while updating the profile",
          details: updateError.message,
        });
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "An unexpected error occurred",
      details: error.message,
    });
  }
};

const getUserInfo = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWRErr: err });
      }
      const { userChoice } = req.body;
      let findUser;
      const userId = auth.userId;
      try {
        if (userChoice === "personalInfo") {
          findUser = await userModel.findById(userId);
          return res.status(200).json({ userInfo: findUser });
        } else if (userChoice === "orders") {
          //will update after order
        } else if (userChoice === "wishList") {
          findUser = await userModel.findById(userId).populate("wishList");
          return res.status(200).json({ userWishList: findUser });
        } else {
          return res.status(204).json({ message: "Please enter any param" });
        }
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
const getUserOrders = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }
      const userId = auth.userId;
      console.log("userId", userId);
      const orderStatus = req.query.orderStatus;
      const findUser = await userModel.findById(userId);
      if (!findUser) {
        return res.status(404).json({ message: "User not found" });
      }
      /*/const getActiveOrders = await orderSchema
        .find({
          userId: userId,
          complete: false,
        })
        .populate({ path: "riderId" });
      const getPreviousOrders = await orderSchema.find({
        userId: userId,
        complete: true,
      });/*/
      if (orderStatus === "active") {
        const ordersOfUser = await orderSchema
          .find({
            userId: userId,
            orderStatus: { $in: ["confirm", "pickUp"] },
          })
          .populate("riderId")
          .populate({
            path: "basketId",
            populate: {
              path: "items.productId",
              model: "productModel",
            },
          });
        return res.status(200).json({
          userOrders: ordersOfUser,
        });
      }

      const ordersOfUser = await orderSchema
        .find({
          userId: userId,
          orderStatus: orderStatus,
        })
        .populate("riderId")
        .populate({
          path: "basketId",
          populate: {
            path: "items.productId",
            model: "productModel",
          },
        });
      return res.status(200).json({
        userOrders: ordersOfUser,
      });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getWishList = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }
      const userId = auth.userId;
      const findUser = await userModel.findById(userId).populate("wishList");
      if (!findUser) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.status(200).json({ wishList: findUser.wishList });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
const tipToTheRider = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }
      const userId = auth.userId;
      const { tipAmount } = req.body;
      const riderId = req.params.riderId;

      const findUser = await userModel.findById(auth.userId);
      if (!findUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const findRider = await userModel.findById(riderId);
      if (!findRider) {
        return res.status(404).json({ message: "Rider not found" });
      }

      const newTip = new Tip({
        tipPaid: userId,
        riderId: riderId,
        tipAmount: tipAmount,
      });

      await newTip.save();

      return res
        .status(200)
        .json({ message: "Tip added successfully", tip: newTip });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/*/
const mongoose = require("mongoose");
const tipSchema = new mongoose.Schema({
  tipPaid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userModel",
  },
  riderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userModel",
  },
  tipAmount: {
    type: Number,
    required: true,
  },
  tipStatus: {
    type: String,
    enum: ["pending", "paid"],
  },
});
module.exports = mongoose.model("tipSchema", tipSchema);

/*/

//abc
const editLocation = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }

      // Extract new coordinates from the request body
      const { latitude, longitude } = req.body;
      if (!latitude || !longitude) {
        return res
          .status(400)
          .json({ message: "Latitude and Longitude are required" });
      }

      const updatedUser = await userModel.findByIdAndUpdate(
        auth.userId,
        {
          $set: {
            location: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
          },
        },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        message: "Location updated successfully",
        userInfo: {
          userId: updatedUser._id,
          userName: updatedUser.userName,
          email: updatedUser.email,
          isVerified: updatedUser.isVerified,
          phoneNumber: updatedUser.phoneNumber,
          deliveryAddress: updatedUser.deliveryAddress,
          userType: updatedUser.userType,
          userAccountType: updatedUser.userAccountType,
          profilePic: updatedUser.profilePic,
          location: updatedUser.location,
        },
      });
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  editProfile,
  getUserOrders,
  getWishList,
  getUserInfo,
  tipToTheRider,
  editLocation,
};
