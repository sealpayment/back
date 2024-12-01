import express from "express";
import dayjs from "dayjs";

import { checkJwt } from "../utils/auth.js";
import {
  createStripePaymentLink,
  refundToCustomer,
} from "../services/stripeServices.js";
import Mission from "../models/missionModel.js";
import { sendEmailWithTemplate } from "../services/emailServices.js";
import { User } from "../models/userModel.js";
import { currencyMap } from "../utils/helpers.js";

const WEBSITE_URL = process.env.WEBSITE_URL;

const router = express.Router();

router.get("/", checkJwt, async ({ user }, res) => {
  const missions = await Mission.find({
    $or: [{ from_user_sub: user._id }, { to_user_sub: user._id }],
  })
    .sort({ endDate: -1 })
    .exec();
  return res.json(missions);
});

router.get("/:id", async (req, res) => {
  const missionId = req.params.id;
  const mission = await Mission.findById(missionId).exec();
  if (!mission) {
    return res.status(404).json({ message: "Mission non trouvée" });
  }
  res.json(mission);
});

router.post("/create", checkJwt, async ({ user, body }, res) => {
  const mission = body;
  let newMission;
  try {
    const recipientUser = await User.findOne({ email: mission.recipient });
    newMission = new Mission({
      ...mission,
      from_user_sub: user._id,
      to_user_sub: recipientUser?._id,
    });
    const link = await createStripePaymentLink(newMission, recipientUser);
    newMission.paymentLink = link;
    await newMission.save();
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error while creating the mission.", error });
  }
  res.status(201).json({
    missionId: newMission.id,
    paymentLink: newMission?.paymentLink,
  });
});

router.post("/ask", checkJwt, async ({ user, body }, res) => {
  const mission = body;

  try {
    const recipientUser = await User.findOne({ email: mission.recipient });
    const newMission = new Mission({
      ...mission,
      from_user_sub: recipientUser?._id,
      to_user_sub: user._id,
    });
    const link = await createStripePaymentLink(newMission, recipientUser);
    newMission.paymentLink = link;
    await newMission.save();
    sendEmailWithTemplate(
      mission.recipient,
      "You Received A Payment Request",
      recipientUser?._id
        ? "./src/templates/payment-request-user.html"
        : "./src/templates/payment-request-anonymous.html",
      {
        provider_email: user.email,
        currency: currencyMap[mission.currency],
        amount: mission.amount.toFixed(2),
        specifications: mission.description,
        approve_link: `${WEBSITE_URL}/auth/login?email=${mission.recipient}`,
        signup_link: `${WEBSITE_URL}/auth/register?email=${mission.recipient}`,
      }
    );
    res.status(201).json({
      message: "Payment link sent successfully",
      missionId: newMission.id,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error while creating the mission.", error });
  }
});

router.post("/:id/accept", checkJwt, async (req, res) => {
  const missionId = req.params.id;

  try {
    const mission = await Mission.findById(missionId);
    if (!mission) {
      return res.status(404).json({ message: "Mission not found." });
    }
    mission.to_user_sub = req.user._id;
    await mission.save();
    res
      .status(200)
      .json({ message: "Mission accepted successfully.", mission });
  } catch (err) {
    res.status(500).json({ message: "Erreur while accepting the mission." });
  }
});

router.post("/:id/reject", checkJwt, async ({ params }, res) => {
  const missionId = params.id;
  try {
    const mission = await Mission.findById(missionId);
    if (!mission) {
      return res.status(404).json({ message: "Mission not found." });
    }
    if (mission.status === "draft") {
      await mission.deleteOne();
      return res.status(200).json({ message: "Mission deleted successfully." });
    }
    if (mission.paymentIntentId) {
      await refundToCustomer(mission.paymentIntentId, mission.amount * 100);
    }
    mission.status = "refund";
    await mission.save();
    res.status(200).json({ message: "Mission refund successfully.", mission });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Erreur while cancelling the mission.", error: err });
  }
});

router.post("/complete-today", async (req, res) => {
  const now = dayjs();

  const fortyEightHoursAgo = now.subtract(48, "hour");
  try {
    const missions = await Mission.find({
      $expr: {
        $and: [
          {
            $gte: ["$endDate", fortyEightHoursAgo.toDate()],
          },
          { $lt: ["$endDate", now.toDate()] },
        ],
      },
      status: "active",
    });
    for (const mission of missions) {
      mission.status = "completed";
      await mission.save();
      sendEmail(
        mission.recipient,
        "Votre mission se termine bientôt",
        `Bonjour, votre mission se termine bientôt. Vous recevrez votre paiement dans les prochaines 48 heures si le destinataire ne signale pas de problème.`
      );
    }
    res.status(200).json({
      message: `Missions completed successfully`,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la mise à jour des missions.",
      error: error.message,
    });
  }
});

export default router;
