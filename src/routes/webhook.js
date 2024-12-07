import express from "express";
import Stripe from "stripe";
import dayjs from "dayjs";

import Mission from "../models/missionModel.js";
import { createConnectedAccount } from "../services/stripeServices.js";
import { User } from "../models/userModel.js";
import { sendEmailWithTemplateKey } from "../services/emailServices.js";
import { currencyMap } from "../utils/helpers.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const EXPRESS_MODE = process.env.EXPRESS_MODE === "true";

const router = express.Router();
router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (request, response) => {
    const sig = request.headers["stripe-signature"];
    let event;
    try {
      event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const missionId = session.metadata.missionId;
      try {
        const mission = await Mission.findById(missionId).exec();
        const endDate = dayjs()
          .add(EXPRESS_MODE ? 7 : 168, EXPRESS_MODE ? "minute" : "hour")
          .set(EXPRESS_MODE ? "second" : "minute", 0)
          .set(EXPRESS_MODE ? "millisecond" : "second", 0)
          .set("millisecond", 0);

        const completedDate = dayjs()
          .add(EXPRESS_MODE ? 5 : 120, EXPRESS_MODE ? "minute" : "hour")
          .set(EXPRESS_MODE ? "second" : "minute", 0)
          .set(EXPRESS_MODE ? "millisecond" : "second", 0)
          .set("millisecond", 0);
        mission.status = "active";
        mission.endDate = endDate;
        mission.paymentIntentId = session.payment_intent;
        const isMissionSent = mission.type === "send";
        const client = await User.findById(mission?.from_user_sub);
        const provider = await User.findById(mission?.to_user_sub);
        if (isMissionSent) {
          sendEmailWithTemplateKey(client.email, "missionCreated", {
            name: client.firstName,
            mission_id: mission.id,
            amount: mission.amount,
            currency: currencyMap[mission.currency],
            provider_email: mission.recipient,
            specifications: mission.description,
          });
          if (provider) {
            sendEmailWithTemplateKey(provider.email, "missionReceivedUser", {
              client_first_name: client.firstName,
              client_email: client.email,
              amount: mission.amount,
              currency: currencyMap[mission.currency],
              specifications: mission.description,
              completed_date: completedDate.format("YYYY MM DD HH:mm"),
            });
          } else {
            sendEmailWithTemplateKey(
              mission.recipient,
              "missionReceivedAnonymous",
              {
                name: mission.recipient,
                client_first_name: client.firstName,
                client_email: client.email,
                amount: mission.amount,
                currency: currencyMap[mission.currency],
                specifications: mission.description,
                completed_date: completedDate.format("YYYY MM DD HH:mm"),
              }
            );
          }
        } else {
          sendEmailWithTemplateKey(client.email, "missionCreated", {
            name: client.firstName,
            mission_id: mission.id,
            amount: mission.amount,
            currency: currencyMap[mission.currency],
            provider_email: provider.email,
            specifications: mission.description,
          });
          sendEmailWithTemplateKey(provider.email, "missionReceived", {
            client_first_name: client.firstName,
            client_email: client.email,
            amount: mission.amount,
            currency: currencyMap[mission.currency],
            specifications: mission.description,
            completed_date: completedDate.format("YYYY MM DD HH:mm"),
          });
        }
        await mission.save();
        response.status(200).json({ message: "Mission is now active" });
      } catch (err) {
        console.log(err);
        response
          .status(500)
          .json({ message: "Error updating mission status", error: err });
      }
    }
    response.send();
  }
);

export default router;
