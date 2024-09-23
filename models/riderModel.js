const mongoose = require("mongoose");
const riderModel = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: function () {
        return this.userAccountType !== "google";
      },
    },
    profilePic: {
      type: String,
    },
    userType: {
      type: String,
      enum: ["user", "rider"],
    },
    userAccountType: {
      type: String,
      enum: ["google", "regular"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    phoneNumber: {
      type: String,
    },
    deliveryAddress: {
      type: String,
    },
    wishList: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "productModel",
      },
    ],
    openToWork: {
      type: Boolean,
      default: false,
    },
  },

  { timestamps: true }
);
