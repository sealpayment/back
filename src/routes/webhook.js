import express from "express";
import Stripe from "stripe";
import dayjs from "dayjs";

import Mission from "../models/missionModel.js";
import { createConnectedAccount } from "../services/stripeServices.js";
import { User } from "../models/userModel.js";
import { sendEmailWithTemplate } from "../services/emailServices.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const WEBSITE_URL = process.env.WEBSITE_URL;

const currencyMap = {
  usd: "$",
  eur: "€",
  gbp: "£",
};

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
        mission.status = "active";
        mission.endDate = dayjs()
          .add(7, "days")
          .set("second", 0)
          .set("millisecond", 0)
          .toDate();
        mission.paymentIntentId = session.payment_intent;
        const isMissionAsked = mission.to_user_sub && !mission.from_user_sub;
        if (!isMissionAsked) {
          const missionData = mission.toObject();
          sendEmailWithTemplate(
            mission.recipient,
            `On vous a envoyé ${mission.amount.toFixed(2)}${
              currencyMap[mission.currency]
            }`,
            "./src/templates/new-payment.html",
            {
              ...missionData,
              redirect_url: `${WEBSITE_URL}/mission`,
              title: "Vous avez reçu un paiement !",
              subtitle: `Vous avez reçu un paiement de ${mission.amount.toFixed(
                2
              )}${currencyMap[mission.currency]}`,
              amount: mission.amount.toFixed(2),
              currency: currencyMap[mission.currency],
            }
          );
        } else {
          const recipientUser = await User.findOne({
            email: mission.recipient,
          });
          mission.from_user_sub = recipientUser.sub;
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

router.post("/auth0-post-login", express.json(), async (req, res) => {
  try {
    const { userId, email } = req.body;
    const existingUser = await User.findOne({ sub: userId });
    if (existingUser) {
      return res.status(409).send({ message: "User already exists" });
    }
    const connectedAccount = await createConnectedAccount({ email });
    await User.create({
      sub: userId,
      connected_account_id: connectedAccount.id,
      email,
    });
    res.status(201).send({ message: "User created successfully" });
  } catch (error) {
    console.error("Error in webhook:", error.message);
    res.status(500).send({ error: error.message });
  }
});

export default router;
