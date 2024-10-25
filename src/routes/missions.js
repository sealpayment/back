import express from "express";

import { checkJwt } from "../utils/auth.js";
import {
  createStripePaymentLink,
  transferFundsToConnectedAccount,
} from "../services/stripeServices.js";
import Mission from "../models/missionModel.js";
import { sendEmail } from "../services/emailServices.js";
import { User } from "../models/userModel.js";

const router = express.Router();
router.get("/", checkJwt, async ({ user }, res) => {
  const missions = await Mission.find({
    $or: [{ from_user_sub: user.sub }, { to_user_sub: user.sub }],
  }).exec();
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

// ... existing code ...

router.post("/complete-today", async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    const result = await Mission.updateMany(
      { endDate: { $gte: today, $lt: tomorrow }, status: { $ne: "completed" } },
      { $set: { status: "completed" } }
    );

    res.status(200).json({
      message: `${result.modifiedCount} missions marked as completed.`,
    });
  } catch (error) {
    console.error("Error completing missions:", error);
    res
      .status(500)
      .json({ message: "Erreur while completing missions.", error });
  }
});

router.post("/paid-today", async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    const missionsPaid = await Mission.find({
      endDate: { $gte: today, $lt: tomorrow },
      status: "completed",
    });

    console.log("Missions paid today:", missionsPaid);

    for (const mission of missionsPaid) {
      const user = await User.findOne({ sub: mission.to_user_sub });
      transferFundsToConnectedAccount(
        user.connected_account_id,
        mission.amount * 100
      );
      mission.status = "paid";
      await mission.save();
    }

    res.status(200).json({
      message: `${missionsPaid.length} missions paid.`,
    });
  } catch (error) {
    console.error("Error completing missions:", error);
    res
      .status(500)
      .json({ message: "Erreur while completing missions.", error });
  }
});

export default router;
