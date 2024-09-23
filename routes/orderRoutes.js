const { acceptRejectValidator } = require("../validations/validation");
const express = require("express");
const { body, check, validationResult } = require("express-validator");
const router = express.Router();
const orderCon = require("../controllers/orderController/orderController");
const verifyToken = require("../middleware/verifyToken");
router.post(
  "/acceptReject",
  verifyToken,
  acceptRejectValidator,
  orderCon.acceptReject
);
router.get("/orderDetail/:orderId", verifyToken, orderCon.orderDetail);
router.get("/getRiderOrders", verifyToken, orderCon.getOrders);
router.put("/updateStatus/:orderId", verifyToken, orderCon.updateStatus);
router.get("/deliveryDetail/:orderId", verifyToken, orderCon.deliveryDetail);
router.post(
  "/returnOrder",
  verifyToken,
  [
    // Validate orderId: must not be empty and should be a valid MongoDB ObjectId
    body("orderId")
      .notEmpty()
      .withMessage("Order ID is required")
      .isMongoId()
      .withMessage("Enter a valid MongoDB ID"),

    // Validate deliveryDate: must not be empty and should be a valid date
    body("deliveryDate")
      .notEmpty()
      .withMessage("Delivery date is required")
      .isISO8601()
      .withMessage("Enter a valid date in ISO 8601 format"),

    // Validate reasonToReturn: must not be empty
    body("reasonToReturn")
      .notEmpty()
      .withMessage("Reason to return is required"),
  ],
  orderCon.returnOrder
);
module.exports = router;
//abc
