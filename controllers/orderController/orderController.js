const shopModel = require("../../models/shopModel");
const secretKey = require("../../config/config");
const categoryModel = require("../../models/categoryModel");
const productModel = require("../../models/productModel");
const userModel = require("../../models/userModel");
const mongoose = require("mongoose");
const cancelOrderSchema = require("../../models/cancelOrderSchema");
const cartSchema = require("../../models/cartSchema");
const orderModel = require("../../models/orderModel");
const { calculateDistance } = require("../shopController/shopController");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { sendNotification } = require("../../utils/sendNotification");

//(registrationTokens, messageContent)
dotenv.config();

const { body, validationResult } = require("express-validator");
//storeLongitude= 74.29491664504988
//storeLatitude=31.444376752468226
const storeLongitude = parseFloat(process.env.storeLongitude);
const storeLatitude = parseFloat(process.env.storeLatitude);
const storeCoordinates = [storeLongitude, storeLatitude];
const selectDriver = async (req, res) => {
  jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
    if (err) {
      return res.status(401).json({ JWTErr: err });
    }
    const userId = auth.userId;
  });
};
const getRegistrationToken = async (userId) => {
  try {
    const user = await userModel.findById(userId).select("registrationToken");
    if (!user) {
      throw new Error("User not found");
    }
    return user.registrationToken;
  } catch (error) {
    throw new Error(`Error retrieving registration token: ${error.message}`);
  }
};
const acceptReject = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }

      const userId = auth.userId;
      let title = "ORDER STATUS";
      let body;
      const { status, orderId } = req.body;

      if (!status || !orderId) {
        return res
          .status(400)
          .json({ message: "Invalid request, missing status or orderId" });
      }

      const checkOrder = await orderModel.findById(orderId);

      if (!checkOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      const findUser = await userModel.findById(checkOrder.userId);
      if (!findUser) {
        return res.status(404).json({ message: "User not found" });
      }
      if (checkOrder.riderDone) {
        return res
          .status(201)
          .json({ message: "Another driver already assigned on this order" });
      }

      if (status === "accept") {
        checkOrder.riderDone = true;
        checkOrder.orderStatus = "confirm";
        checkOrder.riderId = userId;
        await checkOrder.save();
        body = "Your order is accepted";
        console.log("userId", findUser._id);
        const token = await getRegistrationToken(findUser._id);
        console.log(token);
        await sendNotification(token, title, body);
        return res
          .status(200)
          .json({ message: "Order accepted and confirmed", order: checkOrder });
      } else if (status === "reject") {
        checkOrder.rejectedCount += 1;
        if (checkOrder.rejectedCount >= checkOrder.riderQueue.length) {
          checkOrder.requestToAdmin = true;
          await checkOrder.save();
        }
        // const nextRiderId = checkOrder.riderQueue[checkOrder.rejectedCount];
        //const devToken = await getRegistrationToken(nextRiderId);

        await checkOrder.save();
        return res.status(200).json({
          message: "Order rejected and next rider notified",
        });
      }

      return res.status(400).json({ message: "Invalid status" });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
const getOrders = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }
      const userId = auth.userId;
      const orderStatus = req.query.orderStatus;
      const findRider = await userModel.findById(userId);
      if (!findRider) {
        return res.status(404).json({ message: "Rider not found" });
      }
      console.log(auth.userId);
      /*/ const getActiveOrders = await orderModel
        .find({
          riderId: userId,
          complete: false,
        })
        .populate({ path: "riderId" });
      const getPreviousOrders = await orderModel
        .find({
          riderId: userId,
          complete: true,
        })
        .populate({ path: "riderId" });/*/
      if (orderStatus === "pending") {
        const userObjectId = new mongoose.Types.ObjectId(userId);
        console.log(userObjectId);
        const ordersOfUser = await orderModel
          .find({
            // riderId: userId,
            orderStatus: orderStatus,
            riderQueue: { $in: [auth.userId] },
          })
          .populate("userId")
          .populate({
            path: "basketId",
            populate: {
              path: "items.productId",
              model: "productModel",
            },
          });
        return res.status(200).json({
          ordersOfRider: ordersOfUser,
        });
        console.log(ordersOfUser);
      }
      if (orderStatus === "active") {
        const ordersOfUser = await orderModel
          .find({
            riderId: userId,
            orderStatus: { $in: ["confirm", "pickUp"] },
          })
          .populate("userId")
          .populate({
            path: "basketId",
            populate: {
              path: "items.productId",
              model: "productModel",
            },
          });
        return res.status(200).json({
          ordersOfRider: ordersOfUser,
        });
      }

      const ordersOfRider = await orderModel
        .find({
          riderId: userId,
          orderStatus: orderStatus,
        })
        .populate({ path: "riderId" })
        .populate("userId")
        .populate({
          path: "basketId",
          populate: {
            path: "items.productId",
            model: "productModel",
          },
        });
      return res.status(200).json({
        ordersOfRider: ordersOfRider,
      });
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
const updateStatus = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }
      const userId = auth.userId;

      const orderId = req.params.orderId;
      const { status } = req.body;
      const validStatuses = ["pending", "confirm", "pickUp", "DeliveryDone"];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      const findUser = await userModel.findById(userId);
      if (!findUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const findOrder = await orderModel.findOne({
        _id: orderId,
        riderId: userId,
      });
      if (!findOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      findOrder.orderStatus = status;
      await findOrder.save();

      return res
        .status(200)
        .json({ message: "Order status updated", order: findOrder });
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
const orderDetail = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }
      const userId = auth.userId;
      const orderId = req.params.orderId;

      const findUser = await userModel
        .findById(userId)
        .select(
          "-password -userType -isVerified -createdAt -updatedAt -__v -wishList -openToWork"
        );

      if (!findUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const findOrder = await orderModel.findById(orderId).populate({
        path: "basketId",
        populate: {
          path: "items.productId",
          model: "productModel",
        },
      });

      if (!findOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      return res.status(200).json({
        message: "Order details retrieved",
        userDetail: findUser,
        order: findOrder,
      });
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
const deliveryDetail = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }

      const orderId = req.params.orderId;
      const orderDetail = await orderModel.findById(orderId).select("userId");

      if (!orderDetail) {
        return res.status(404).json({ message: "Order not found" });
      }

      const findUser = await userModel
        .findById(orderDetail.userId)
        .select(
          "-password -userType -isVerified -createdAt -updatedAt -__v -wishList -openToWork"
        );
      const findRider = await userModel
        .findById(auth.userId)
        .select(
          "-password -userType -isVerified -createdAt -updatedAt -__v -wishList -openToWork"
        );

      if (!findUser) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!findRider) {
        return res.status(404).json({ message: "Rider not found" });
      }

      const getDistanceFromStoreToUser = calculateDistance(
        findUser.location.coordinates,
        storeCoordinates
      );

      const getDistanceFromRiderToStore = calculateDistance(
        findRider.location.coordinates,
        storeCoordinates
      );
      const averageSpeedKmh = 15;

      const timeFromStoreToUser = getDistanceFromStoreToUser / averageSpeedKmh;
      const timeFromRiderToStore =
        getDistanceFromRiderToStore / averageSpeedKmh;
      const timeFromStoreToUserMinutes = timeFromStoreToUser * 60;
      const timeFromRiderToStoreMinutes = timeFromRiderToStore * 60;

      res.status(200).json({
        user: findUser,
        rider: findRider,
        distanceFromStoreToUser: getDistanceFromStoreToUser,
        distanceFromRiderToStore: getDistanceFromRiderToStore,
        timeFromStoreToUserMinutes: timeFromStoreToUserMinutes,
        timeFromRiderToStoreMinutes: timeFromRiderToStoreMinutes,
      });
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
/*/const reOrder = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }
      const userId = auth.userId;
      const orderId = req.params.id;
      const findOrder = await orderModel.findById(orderId);
      if (!findOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
       
    });
  } catch (error) {}
};/*/
//const
/*/
deliveryDate: {
    type: Date,
  },
  reason: {
    type: String,
  },
/*/
const returnOrder = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ message: "Invalid token", error: err });
      }

      const { orderId, deliveryDate, reasonToReturn } = req.body;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Find the order
      const findOrder = await orderSchema.findById(orderId);
      if (!findOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Create a new return/cancellation order
      const newCancel = new cancelOrderSchema({
        userId: auth.userId,
        orderId: orderId,
        deliveryDate: deliveryDate,
        reason: reasonToReturn, // corrected the field name
      });

      // Save the return order
      await newCancel.save();

      return res.status(200).json({
        message: "Order return initiated successfully",
        cancelOrder: newCancel,
      });
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  acceptReject,
  updateStatus,
  orderDetail,
  getOrders,
  deliveryDetail,
  returnOrder,
};
