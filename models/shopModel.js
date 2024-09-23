const mongoose = require("mongoose");
const shopModel = new mongoose.Schema(
  {
    shopName: {
      type: String,
      required: true,
    },
    shopPic: {
      type: String,
      required: true,
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "subCategoryModel",
      },
    ],
  },
  {
    timestamps: true,
  }
);
module.exports = shopModel;
