import express from "express";
import dayjs from "dayjs";

import { checkJwt, getUserByEmail } from "../utils/auth.js";
import {
  createStripePaymentLink,
  payoutToConnectedBankAccount,
  refundToCustomer,
  transferFromConnectedAccount,
  transferToConnectedAccount,
} from "../services/stripeServices.js";
import Mission from "../models/missionModel.js";
import { sendEmail } from "../services/emailServices.js";
import { User } from "../models/userModel.js";

const router = express.Router();

router.get("/", checkJwt, async ({ user }, res) => {
  const missions = await Mission.find({
    $or: [{ from_user_sub: user.sub }, { to_user_sub: user.sub }],
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
    const knownUser = await getUserByEmail(mission.recipient);
    newMission = new Mission({
      ...mission,
      from_user_sub: user.sub,
      to_user_sub: knownUser?.user_id,
    });
    const fromUser = await User.findOne({ sub: user.sub });
    const toUser = await User.findOne({ sub: knownUser?.user_id });

    if (fromUser.connected_account_id && mission.useDeposit) {
      transferFromConnectedAccount(
        fromUser.connected_account_id,
        parseFloat(mission.amount.replace(",", ".")) * 100
      );
      newMission.status = "active";
      newMission.endDate = dayjs().add(7, "minutes").set("second", 0).toDate();
    } else {
      const link = await createStripePaymentLink(newMission, toUser);
      newMission.paymentLink = link;
    }
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

router.post("/ask", checkJwt, async (req, res) => {
  const mission = req.body;

  let newMission;
  try {
    newMission = new Mission({
      ...mission,
      to_user_sub: req.user.sub,
    });
    const link = await createStripePaymentLink(newMission);
    newMission.paymentLink = link;
    await newMission.save();

    sendEmail(
      mission.recipient,
      "Tristan vous demande de collaborer",
      `Bonjour, Tristan vous demande de payer ${mission.amount}€. Cliquez sur le lien suivant pour payer directement : ${link}`
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
    mission.to_user_sub = req.user.sub;
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
    if (mission.status === "active") {
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
  const now = new Date();

  const twoMinutesInMillis = 2 * 60 * 1000;

  try {
    const missions = await Mission.find({
      $expr: {
        $and: [
          { $gte: ["$endDate", now] },
          { $lt: ["$endDate", new Date(now.getTime() + twoMinutesInMillis)] },
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
