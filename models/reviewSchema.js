const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userModel",
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "productModel",
  },
  rate: {
    type: Number,
    required: true,
  },
});
module.exports = mongoose.model("reviewSchema", reviewSchema);
