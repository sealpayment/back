import express from "express";
import Stripe from "stripe";

import Mission from "../models/missionModel.js";
import { sendEmail } from "../services/emailServices.js";

const stripe = new Stripe(
  "sk_test_51Jp7SJCvCiK1jJUqrLwf4VqfGlf1fXulG7DNjaKRuWqrZfeMLjyCltPLJHcFCwcgWY4yowapIY5UUdqBZPHDbQ6d00PJGnDozg"
);

const endpointSecret =
  "whsec_f245c693f6f06691658f58c38c453ac5b7da667bbc24a5aec5344fe09193c544";

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
        mission.status = "pending";
        await mission.save();
        sendEmail(
          mission.recipient,
          "Tristan vous invite à collaborer",
          `Bonjour, Tristan vous a envoyé ${mission.amount}€ pour collaborer. Cliquez sur le lien suivant pour récupérer votre argent: ` +
            `http://localhost:3000/accept-mission/${missionId}`
        );
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

export default router;
