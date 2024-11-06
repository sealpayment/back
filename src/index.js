import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { createServer } from "http";
import pkg from "body-parser";
import cron from "node-cron";
import axios from "axios";
const { json } = pkg;

import MissionsRouter from "./routes/missions.js";
import PaymentRouter from "./routes/payment.js";
import WebhookRouter from "./routes/webhook.js";
import StripeRouter from "./routes/stripe.js";
import UserRouter from "./routes/user.js";
import DisputeRouter from "./routes/dispute.js";

const PORT = process.env.PORT || 9000;
const URL = `http://127.0.0.1:${PORT}`;
const DB_URL =
  process.env.ENV === "production"
    ? process.env.DB_URL
    : "mongodb://127.0.0.1:27017/bindpay";

const __dirname = path.resolve();

const app = express();

app.use("/api/webhook", WebhookRouter);
app.use(
  express.urlencoded({
    extended: false,
  })
);
app.use(cors(), json());

app.use(
  express.json({
    limit: 1024 * 1024 * 1024,
    type: "application/json",
  })
);

app.use(express.static(path.join(__dirname, "public")));

app.use("/api/missions", MissionsRouter);
app.use("/api/payment", PaymentRouter);
app.use("/api/stripe", StripeRouter);
app.use("/api/users", UserRouter);
app.use("/api/disputes", DisputeRouter);

cron.schedule("*/30 * * * * *", async () => {
  console.log("Running cron job", new Date());
  try {
    await axios.post(`${process.env.API_URL}/api/missions/complete-today`);
  } catch (error) {
    console.log("Error while completing and paying missions", error);
  }
});

cron.schedule("*/30 * * * * *", async () => {
  console.log("Running cron job", new Date());
  try {
    await axios.post(`${process.env.API_URL}/api/missions/paid-today`);
  } catch (error) {
    console.log("Error while completing and paying missions", error);
  }
});

const httpServer = createServer(app);
mongoose
  .connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Server REST is now running on ${URL}`);
    });
  })
  .catch((err) => console.error(err));
