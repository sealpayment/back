import express from "express";

import { checkJwt } from "../utils/auth.js";
import { createStripePaymentLink } from "../services/stripeServices.js";
import Mission from "../models/missionModel.js";

const router = express.Router();
router.get("/", checkJwt, async ({ user }, res) => {
  const missions = await Mission.find({ user_sub: user.sub }).exec();
  return res.json(missions);
});

router.get("/:id", async (req, res) => {
  const missionId = req.params.id;
  console.log(missionId);
  const mission = await Mission.findById(missionId).exec();
  if (!mission) {
    return res.status(404).json({ message: "Mission non trouvée" });
  }
  console.log(mission);
  res.json(mission);
});

router.post("/", async (req, res) => {
  const mission = req.body;
  const { name, description, amount } = mission;
  if (!name || !description || !amount) {
    return res.status(400).json({ message: "Nom et description requis" });
  }

  let newMission;
  try {
    newMission = await new Mission(mission).save();
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error while creating the mission.", error });
  }
  const link = await createStripePaymentLink(newMission);
  newMission.paymentLink = link;
  newMission.save();

  res.status(201).json({
    missionId: newMission.id,
    paymentLink: link,
  });
});

router.put("/:id", (req, res) => {
  const missionId = parseInt(req.params.id);
  const mission = missions.find((m) => m.id === missionId);
  if (!mission) {
    return res.status(404).json({ message: "Mission non trouvée" });
  }

  const { name, description } = req.body;
  if (!name || !description) {
    return res.status(400).json({ message: "Nom et description requis" });
  }

  mission.name = name;
  mission.description = description;

  res.json(mission);
});

router.delete("/:id", (req, res) => {
  const missionId = parseInt(req.params.id);
  const missionIndex = missions.findIndex((m) => m.id === missionId);
  if (missionIndex === -1) {
    return res.status(404).json({ message: "Mission non trouvée" });
  }

  missions.splice(missionIndex, 1);
  res.status(204).send(); // 204 No Content
});

router.post("/:id/accept", async (req, res) => {
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

export default router;
