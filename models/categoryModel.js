const mongoose = require("mongoose");
const categoryModel = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: true,
    },
    categoryPic: {
      type: String,
      required: true,
    },
    subCategories: [
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
module.exports = mongoose.model("categoryModel", categoryModel);
