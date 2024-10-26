import express from "express";
import dayjs from "dayjs";

import { checkJwt } from "../utils/auth.js";
import {
  createStripePaymentLink,
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

router.post("/create", checkJwt, async (req, res) => {
  const mission = req.body;
  let newMission;
  try {
    newMission = new Mission({
      ...mission,
      from_user_sub: req.user.sub,
    });
    const link = await createStripePaymentLink(newMission);
    newMission.paymentLink = link;
    await newMission.save();
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error while creating the mission.", error });
  }
  res.status(201).json({
    missionId: newMission.id,
    paymentLink: newMission.paymentLink,
  });
});

router.post("/ask", checkJwt, async (req, res) => {
  const mission = req.body;
  const { name, description, amount, recipient } = mission;
  if (!name || !description || !amount || !recipient) {
    return res
      .status(400)
      .json({ message: "Nom, description, montant et email requis" });
  }

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
    if (mission.status !== "pending") {
      return res.status(400).json({ message: "Mission is not available." });
    }
    mission.status = "active";
    mission.to_user_sub = req.user.sub;
    await mission.save();
    res
      .status(200)
      .json({ message: "Mission accepted successfully.", mission });
  } catch (err) {
    res.status(500).json({ message: "Erreur while accepting the mission." });
  }
});

router.post("/missions/:id/reject", async (req, res) => {
  const missionId = req.params.id;

  try {
    const mission = await Mission.findByIdAndUpdate(
      missionId,
      { status: "declined" },
      { new: true }
    );
    if (!mission) {
      return res.status(404).json({ message: "Mission not found." });
    }
    res
      .status(200)
      .json({ message: "Mission rejected successfully.", mission });
  } catch (err) {
    res.status(500).json({ message: "Erreur while rejecting the mission." });
  }
});

router.post("/complete-today", async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    const result = await Mission.updateMany(
      {
        endDate: { $gte: today, $lt: tomorrow },
        status: "active",
      },
      { $set: { status: "completed" } }
    );
    console.log(`Today's missions completed: ${result.modifiedCount}`);
    res.status(200).json({
      message: `Today's missions completed: ${result.modifiedCount}`,
    });
  } catch (error) {
    console.error("Erreur lors de la complétion des missions:", error);
    res.status(500).json({
      message: "Erreur lors de la complétion des missions.",
      error: error.message,
    });
  }
});

router.post("/paid-today", async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    const missionsToPay = await Mission.find({
      endDate: { $lt: tomorrow },
      status: "completed",
    });

    for (const mission of missionsToPay) {
      const user = await User.findOne({ sub: mission.to_user_sub });
      if (!user) {
        console.error(`Utilisateur non trouvé pour la mission: ${mission.id}`);
        continue;
      }
      try {
        const transfer = await transferToConnectedAccount(
          user.connected_account_id,
          mission.amount * 100
        );
        if (transfer) {
          mission.status = "paid";
        } else {
          console.error(
            `Erreur lors du transfert pour la mission: ${mission.id}`
          );
        }
      } catch (transferError) {
        console.error(
          `Erreur lors du transfert pour la mission: ${mission.id}`,
          transferError
        );
        mission.status = "error";
      }
      await mission.save();
    }
    res.status(200).json({
      message: `Today's payments successful`,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors du paiement des missions.",
      error: error.message,
    });
  }
});

export default router;
