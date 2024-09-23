const mongoose = require("mongoose");

const orderModel = new mongoose.Schema(
  {
    orderPrice: {
      type: Number,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userModel",
      required: true,
    },
    basketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "cartSchema",
    },
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userModel",
    },

    orderStatus: {
      type: String,
      enum: ["pending", "confirm", "pickUp", "DeliveryDone"], //orderStatus "confirm", "pickUp"
      default: "pending",
    },
    complete: {
      type: Boolean,
      default: false,
    },
    riderQueue: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "userModel",
      },
    ],
    rejectedCount: {
      type: Number,
      default: 0,
    },
    requestToAdmin: {
      type: Boolean,
      default: false,
    },
    riderDone: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("orderModel", orderModel);
