const mongoose = require("mongoose");
const productModel = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
    },
    productPic: {
      type: String,
      required: true,
    },
    productPrice: {
      type: Number,
      required: true,
    },
    sale: {
      type: Boolean,
      default: false,
    },
    salePercentage: {
      type: Number,
    },
    salePrice: {
      type: Number,
    },
    reviews: {
      type: Number,
    },
    popularity: {
      type: Number,
      default: 0,
    },
    wishList: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "userModel",
      },
    ],
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("productModel", productModel);
