const mongoose = require("mongoose");
const itemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "productModel",
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity cannot be less than 1"],
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("itemSchema", itemSchema);
const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userModel",
    },
    items: [itemSchema],
    active: {
      type: Boolean,
      default: true,
    },
    modifiedOn: {
      type: Date,
      default: Date.now(),
    },
    subTotal: {
      type: Number,
      default: 0,
    },
    deliveryCast: {
      type: Number,
      default: 0,
    },
    serviceCharges: {
      type: Number,
    },
    totalPrice: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: Boolean,
      default: false,
    },
    orderDone: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("cartSchema", cartSchema);
