const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(
  "sk_test_51HrgPnHIlG22eyXZ5wKOgHsDFQytmNm6ODbh1yueQFuYCHZR6OvJj4vpQrsvdF7WV0aH4XcVmRkJzjpfdk6PUNcD00bJy7Mhoq"
);
const cartSchema = require("../models/cartSchema");
const secretKey = require("../config/config"); // Ensure this is the correct path
const verifyToken = require("../middleware/verifyToken");
const endpointSecret = "whsec_mGjKpjcaAmq3yAg6r4TKKudrJWle3eoC"; //"whsec_mGjKpjcaAmq3yAg6r4TKKudrJWle3eoC"; // Update if needed

router.post("/create-payment-intent", verifyToken, async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTERR: err.message });
      }

      const userId = auth.userId;
      const { amount, paymentMethodId, cartId } = req.body;

      const findCartAndUpdate = await cartSchema.findByIdAndUpdate(
        cartId,
        { paymentStatus: true },
        { new: true }
      );

      /*/  const findUser = await cartSchema.findById(cartId);
      if (!findUser) {
        return res.status(401).json({ message: "User not found" });
      }/*/

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
            userId: userId,
          },
        });

        res.json({ client_secret: paymentIntent.client_secret });
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Error processing request" });
  }
});

module.exports = router;
