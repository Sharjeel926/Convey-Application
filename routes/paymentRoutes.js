/*/const verifyToken = require("../middleware/verifyToken");
//const order = require("../models/orderModel");
const cartSchema = require("../models/cartSchema");
const secretKey = require("../config/config");
const stripe = require("stripe")(
  "sk_test_51HrgPnHIlG22eyXZ5wKOgHsDFQytmNm6ODbh1yueQFuYCHZR6OvJj4vpQrsvdF7WV0aH4XcVmRkJzjpfdk6PUNcD00bJy7Mhoq"
);
const endpoint_secret =
  "whsec_0e2b1509325be84c2054dcfc0c7dbe38536c8322c048fe8c4de862ca8b6fc3de"; //"whsec_RUJM4UIA3PP4F39YpYhMx7WWRCjuKA10";

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

router.post("/create-payment-intent", verifyToken, async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTERR: err });
      }
      const userId = auth.userId;
      const { amount, paymentMethodId, cartId } = req.body;

      const findUser = await cartSchema.findById(cartId);
      if (!findUser) {
        return res.status(401).json({ message: "User not found" });
      }
      if (findUser) {
         if (
  findUser.subscription === true &&
  subscriptionType === "subscription"
) {
  return res.status(409).json({
    message: "User already subscribed to Ad removing functionality",
  });
}
if (findUser.subscription2 === true && subscriptionType === "subscription2") {
  return res
    .status(409)
    .json({ message: "User already subscribed to all program access" });
}
if (
  findUser.customSubscription === true &&
  subscriptionType === "customSubscription"
) {
  return res.status(409).json({
    message: "User already subscribed to custom subscription",
  });
} 
      }
      try {
        await stripe.paymentMethods.retrieve(paymentMethodId);
      } catch (error) {
        if (
          error.code === "resource_missing" &&
          error.param === "payment_method"
        ) {
          return res.status(400).json({ error: "Invalid payment method" });
        }
        throw error;
      }
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100,
        currency: "usd",
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
        metadata: {
          subscriptionType: subscriptionType,
          userId: userId,
        },
      });

      res.json({ client_secret: paymentIntent.client_secret });
    });
  } catch (error) {
    // console.error("Error creating payment intent:", error.message);
    return res.status(500).json({ error: "Error creating payment intent" });
  }
});
module.exports = router;
/*/
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(
  "sk_test_51HrgPnHIlG22eyXZ5wKOgHsDFQytmNm6ODbh1yueQFuYCHZR6OvJj4vpQrsvdF7WV0aH4XcVmRkJzjpfdk6PUNcD00bJy7Mhoq"
);
const cartSchema = require("../models/cartSchema");
const secretKey = require("../config/config"); // Ensure this is the correct path
const verifyToken = require("../middleware/verifyToken");
const endpointSecret =
  "whsec_0e2b1509325be84c2054dcfc0c7dbe38536c8322c048fe8c4de862ca8b6fc3de"; // Update if needed

router.post("/create-payment-intent", verifyToken, async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTERR: err.message });
      }

      const userId = auth.userId;
      const { amount, paymentMethodId, cartId, subscriptionType } = req.body;

      const findUser = await cartSchema.findById(cartId);
      if (!findUser) {
        return res.status(401).json({ message: "User not found" });
      }

      try {
        await stripe.paymentMethods.retrieve(paymentMethodId);
      } catch (error) {
        if (
          error.code === "resource_missing" &&
          error.param === "payment_method"
        ) {
          return res.status(400).json({ error: "Invalid payment method" });
        }
        return res
          .status(500)
          .json({ error: "Error retrieving payment method" });
      }

      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount * 100,
          currency: "usd",
          payment_method: paymentMethodId,
          confirm: true,
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: "never",
          },
          metadata: {
            subscriptionType: subscriptionType,
            userId: userId,
          },
        });

        res.json({ client_secret: paymentIntent.client_secret });
      } catch (error) {
        return res.status(500).json({ error: "Error creating payment intent" });
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Error processing request" });
  }
});

module.exports = router;
