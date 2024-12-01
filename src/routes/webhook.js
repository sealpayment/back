import express from "express";
import Stripe from "stripe";
import dayjs from "dayjs";

import Mission from "../models/missionModel.js";
import { createConnectedAccount } from "../services/stripeServices.js";
import { User } from "../models/userModel.js";
import { sendEmailWithTemplate } from "../services/emailServices.js";
import { currencyMap } from "../utils/helpers.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const WEBSITE_URL = process.env.WEBSITE_URL;

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
          .add(3, "days")
          .set("second", 0)
          .set("millisecond", 0);
        const completedDate = dayjs()
          .add(1, "days")
          .set("second", 0)
          .set("millisecond", 0);
        mission.status = "active";
        mission.endDate = endDate;
        mission.paymentIntentId = session.payment_intent;
        const isMissionSent = mission.type === "send";
        if (isMissionSent) {
          const sender = await User.findById(mission?.from_user_sub);
          const client = await User.findById(mission?.to_user_sub);
          sendEmailWithTemplate(
            mission.recipient,
            `You Received a Payment from ${sender?.email}`,
            "./src/templates/mission-received.html",
            {
              recipient_name: client?.firstName,
              sender_first_name: sender?.firstName,
              sender_email: sender?.email,
              currency: currencyMap[mission.currency],
              amount: mission.amount.toFixed(2),
              specifications: mission?.description,
              completed_date: completedDate,
            }
          );
          sendEmailWithTemplate(
            sender.email,
            `You Sent a Payment to ${mission.recipient}`,
            "./src/templates/create-mission-success.html",
            {
              client_email: mission.recipient,
              currency: currencyMap[mission.currency],
              amount: mission.amount.toFixed(2),
              specifications: mission.description,
            }
          );
        } else {
          const sender = await User.findById(mission?.from_user_sub);
          const client = await User.findById(mission?.to_user_sub);
          sendEmailWithTemplate(
            sender.email,
            `You Sent a Payment to ${client.email}`,
            "./src/templates/create-mission-success.html",
            {
              client_email: client.email,
              currency: currencyMap[mission.currency],
              amount: mission.amount.toFixed(2),
              specifications: mission.description,
            }
          );
          sendEmailWithTemplate(
            client.email,
            `You Received a Payment from ${sender.email}`,
            "./src/templates/mission-received.html",
            {
              recipient_name: client.firstName,
              sender_first_name: sender.firstName,
              sender_email: sender.email,
              currency: currencyMap[mission.currency],
              amount: mission.amount.toFixed(2),
              specifications: mission.description,
              action_link: `${WEBSITE_URL}/missions`,
            }
          );
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
