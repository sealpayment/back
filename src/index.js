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
import WebhookRouter from "./routes/webhook.js";
import StripeRouter from "./routes/stripe.js";
import UserRouter from "./routes/user.js";
import DisputeRouter from "./routes/dispute.js";
import AuthRouter from "./routes/auth.js";
import CronRouter from "./routes/cron.js";

const EXPRESS_MODE = process.env.EXPRESS_MODE === "true";
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

app.use(
  express.static(path.join(__dirname, "public"), {
    setHeaders: (res, path) => {
      res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache long
      res.setHeader("Content-Type", "image/jpeg", "image/png", "image/jpg");
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=63072000; includeSubDomains; preload"
      );
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; img-src 'self'"
      );
    },
  })
);

app.use("/api/auth", AuthRouter);
app.use("/api/missions", MissionsRouter);
app.use("/api/stripe", StripeRouter);
app.use("/api/users", UserRouter);
app.use("/api/disputes", DisputeRouter);
app.use("/api/cron", CronRouter);

cron.schedule(EXPRESS_MODE ? "* * * * *" : "0 * * * *", async () => {
  try {
    await axios.post(`${process.env.API_URL}/api/cron/should-remind`);
    await axios.post(`${process.env.API_URL}/api/cron/should-complete`);
    await axios.post(`${process.env.API_URL}/api/cron/should-pay`);
    await axios.post(`${process.env.API_URL}/api/cron/check-disputes`);
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
      console.log(`Database is now connected to ${DB_URL}`);
    });
  })
  .catch((err) => console.error(err));
