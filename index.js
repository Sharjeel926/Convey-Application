const express = require("express");
const cors = require("cors");
const app = express();
const { StripeWebhook } = require("./stripe/stripe");
const port = process.env.PORT || 3600;
const database = require("./database/database");
const swaggerSpec = require("./swagger/swagger");
const swaggerUi = require("swagger-ui-express");
//const { stripeWebHook } = require("./stripe/stripe");
const authRouter = require("./routes/authRoute");
const userRouter = require("./routes/userRoutes");
const adminRouter = require("./routes/adminRoute");
const shopRouter = require("./routes/shopRoutes");
const orderRouter = require("./routes/orderRoutes");
const paymentRouter = require("./routes/paymentRoute");

const corsOptions = {
  origin: [
    "https://convy-gamma.vercel.app",
    "http://localhost:3000",
    "https://cors-test.codehappy.dev/",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
//app.options("*", cors(corsOptions));

// Stripe webhook endpoint
app.post("/webHook", express.raw({ type: "application/json" }), StripeWebhook); //gloa/webHook

// Middleware for parsing JSON bodies
app.use(express.json());

// Swagger documentation endpoint
app.use("/api-doc", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/shop", shopRouter);
app.use("/api/order", orderRouter);
app.use("/api/payment", paymentRouter);
// Start the server
app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
