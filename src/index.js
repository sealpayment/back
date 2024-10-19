import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { createServer } from "http";
import pkg from "body-parser";
const { json } = pkg;

import AuthRouter from "./routes/auth.js";
import UserRouter from "./routes/user.js";
import MissionsRouter from "./routes/missions.js";
import PaymentRouter from "./routes/payment.js";
import WebhookRouter from "./routes/webhook.js";

const PORT = process.env.PORT || 9000;
const URL = `http://127.0.0.1:${PORT}`;
const DB_URL =
  process.env.ENV === "production"
    ? process.env.DB_URL.replace("<password>", process.env.DB_PASSWORD)
    : "mongodb://127.0.0.1:27017/bindpay";
const __dirname = path.resolve();

const app = express();
app.use("/api/webhook", WebhookRouter);

app.use(
  express.json({
    limit: 1024 * 1024 * 1024,
    type: "application/json",
  })
);

app.use(express.static(path.join(__dirname, "public")));
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(cors(), json());

app.use("/api/auth", AuthRouter);
app.use("/api/user", UserRouter);
app.use("/api/missions", MissionsRouter);
app.use("/api/payment", PaymentRouter);

const httpServer = createServer(app);
mongoose
  .connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Database connected to", DB_URL);
    httpServer.listen(PORT, () => {
      console.log(`Server REST is now running on ${URL}`);
    });
  })
  .catch((err) => console.error(err));
