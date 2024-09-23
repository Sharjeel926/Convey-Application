const mongoose = require("mongoose");

const cancelOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userModel",
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "orderModel",
    },
    deliveryDate: {
      type: Date,
    },
    reason: {
      type: String,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("cancelOrderSchema", cancelOrderSchema);
