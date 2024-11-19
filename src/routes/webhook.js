import express from "express";
import Stripe from "stripe";

import Mission from "../models/missionModel.js";
import { sendEmail } from "../services/emailServices.js";
import dayjs from "dayjs";
import { createConnectedAccount } from "../services/stripeServices.js";
import { User } from "../models/userModel.js";

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
        const mission = await Mission.findById(missionId);
        mission.status = "active";
        mission.endDate = dayjs().add(7, "minutes").set("second", 0).toDate();
        mission.paymentIntentId = session.payment_intent;
        await mission.save();

        const isMissionAsked = mission.to_user_sub && !mission.from_user_sub;
        if (!isMissionAsked) {
          sendEmail(
            mission.recipient,
            "Tristan vous invite à collaborer",
            `Bonjour, Tristan vous a envoyé ${mission.amount}€ pour collaborer. Cliquez sur le lien suivant pour récupérer votre argent: ` +
              `${WEBSITE_URL}/accept-mission/${missionId}`
          );
        }
        response.status(200).json({ message: "Mission is now active" });
      } catch (err) {
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
