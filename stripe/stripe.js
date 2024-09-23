const stripe = require("stripe")();
//abc
const endpoint_secret = "";

async function StripeWebhook(req, res) {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpoint_secret);
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    // console.log(`Webhook Error: ${err.message}`);
    return;
  }

  switch (
    event.type //abc
  ) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      //  const subscriptionType = paymentIntent.metadata.subscriptionType;
      const userId = paymentIntent.metadata.userId;

      try {
        const foundUser = await userModel.findById(userId);

        if (!foundUser) {
          console.log("User not found with ID:", userId);
        }

        if (subscriptionType === "subscription") {
          foundUser.subscription = true;
        } else if (subscriptionType === "subscription2") {
          foundUser.subscription2 = true;
        } else if (subscriptionType === "customSubscription") {
          foundUser.customSubscription = true;
        }

        await foundUser.save();
      } catch (error) {
        console.log(error.message);
      }
  }

  res.status(200).end();
}

module.exports = { StripeWebhook };
