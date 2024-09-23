const mongoose = require("mongoose");

const userModel = new mongoose.Schema(
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
      enum: ["user", "rider", "Admin", "superAdmin"],
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
    HomeAddress: {
      //update this according to name and location
      type: { type: String, default: "Point" },
      locationName: {
        type: String,
        /*/required: () => {
            return this.userType === "rider";
          },/*/
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
        /*/required: () => {
            return this.userType === "rider";
          },/*/
      },
    },
    preferredDeliveryArea: {
      type: { type: String, default: "Point" },
      locationName: {
        type: String,
        /*/ required: function () {
          return this.userType === "rider"; // Conditional required
        },/*/
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
        /*/ required: function () {
          return this.userType === "rider";
        },/*/
      },
    },

    preferredTimeSlot: {
      from: {
        hour: {
          type: Number,
          /*/ required: () => {
            return this.userType === "rider";
          },/*/
        },
        minute: {
          type: Number,
          /*/required: () => {
            return this.userType === "rider";
          },/*/
        },
        period: {
          type: String,
          enum: ["AM", "PM"],
          /*/required: () => {
            return this.userType === "rider";
          },/*/
        },
      },
      to: {
        hour: {
          type: Number,
          /*/required: () => {
            return this.userType === "rider";
          },/*/
        },
        minute: {
          type: Number,
          /*/required: () => {
            return this.userType === "rider";
          },/*/
        },
        period: {
          type: String,
          enum: ["AM", "PM"],
          /*/required: () => {
            return this.userType === "rider";
          },/*/
        },
      },
    },
    location: {
      type: { type: String, default: "Point" },
      locationName: {
        type: String,
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    startDate: {
      type: Date,
      /*/required: () => {
            return this.userType === "rider";
          },/*/
    },
    openToWork: {
      type: Boolean,
      default: true,
      /*/required: () => {
            return this.userType === "rider";
          },/*/
    },
    registrationToken: {
      type: String,
    },
    status: {
      //for admin side
      type: Boolean,
      //enum: ["accept", "reject"],
    },
    deActiveStatus: {
      type: Boolean,
      default: false,
    },
    approved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
userModel.index({ location: "2dsphere" });

module.exports = mongoose.model("userModel", userModel);
