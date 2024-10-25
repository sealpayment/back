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

app.use("/api/missions", MissionsRouter);
app.use("/api/payment", PaymentRouter);
app.use("/api/stripe", StripeRouter);
app.use("/api/users", UserRouter);

cron.schedule("* * * * *", async () => {
  try {
    axios.post("http://127.0.0.1:9000/api/missions/complete-today");
    axios.post("http://127.0.0.1:9000/api/missions/paid-today");
    console.log(
      "Missions vérifiées et mises à jour toutes les minutes pour les tests."
    );
  } catch (error) {
    console.error(
      "Erreur lors de l'exécution de la tâche cron de test:",
      error
    );
  }
});

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
