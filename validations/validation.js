const express = require("express");
const { body, validationResult } = require("express-validator");

const acceptRejectValidator = [
  body("status")
    .notEmpty()
    .withMessage("Status is must")
    .custom((value) => {
      if (value !== "accept" || value !== "reject") {
        throw new Error("Status must be either 'accept' or 'reject'");
      }
      return true;
    }),
];
module.exports = { acceptRejectValidator };
