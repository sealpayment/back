import express from "express";

import { createStripePaymentLink } from "../services/stripeServices.js";
import Mission from "../models/missionModel.js";

const router = express.Router();
router.get("/", (req, res) => {
  const missions = Mission.find();
  res.json(missions);
});

router.get("/:id", (req, res) => {
  const missionId = parseInt(req.params.id);
  const mission = Mission.findById(missionId);
  if (!mission) {
    return res.status(404).json({ message: "Mission non trouvée" });
  }
  res.json(mission);
});

router.post("/", async (req, res) => {
  const mission = req.body;
  const { name, description, amount } = mission;
  if (!name || !description || !amount) {
    return res.status(400).json({ message: "Nom et description requis" });
  }

  try {
    const newMission = await new Mission(mission).save();
    const paymentLink = await createStripePaymentLink(newMission);
    newMission.paymentLink = paymentLink.url;
    newMission.save();

    res.status(201).json({
      missionId: newMission.id,
      paymentLink: paymentLink.url,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Erreur lors de la création du lien de paiement" });
  }
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

export default router;
