const mongoose = require("mongoose");
const tipSchema = new mongoose.Schema({
  tipPaid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userModel",
  },
  riderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userModel",
  },
  tipAmount: {
    type: Number,
    required: true,
  },
  tipStatus: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending",
  },
});
module.exports = mongoose.model("tipSchema", tipSchema);
