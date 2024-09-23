const mongoose = require("mongoose");
const subCategoryModel = new mongoose.Schema(
  {
    subCategoryName: {
      type: String,
      required: true,
    },
    subCategoryPic: {
      type: String,
      //required: true,
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "productModel",
      },
    ],
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("subCategoryModel", subCategoryModel);
