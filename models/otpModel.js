const mongoose = require("mongoose");
const otpModel = new mongoose.Schema(
  {
    otp: {
      type: String,
    },
    email: {
      type: String,
    },

    expiresAt: {
      type: Date,
      default: Date.now,
      expires: 10,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("otpModel", otpModel);
