import {
  findMissions,
  findMissionById,
  createNewMission,
  updateMissionStatus,
  sendMissionEmail,
  handleMissionPayment,
  handleMissionRefund,
} from "../services/missionService.js";

export const getMissions = async (req, res) => {
  try {
    const missions = await findMissions(req.user.sub);
    res.json(missions);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des missions.", error });
  }
};

export const getMissionById = async (req, res) => {
  try {
    const mission = await findMissionById(req.params.id);
    if (!mission) {
      return res.status(404).json({ message: "Mission non trouvée" });
    }
    res.json(mission);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération de la mission.",
      error,
    });
  }
};

export const createMission = async (req, res) => {
  try {
    const newMission = await createNewMission(req.user, req.body);
    res.status(201).json({
      missionId: newMission.id,
      paymentLink: newMission?.paymentLink,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la création de la mission.", error });
  }
};

export const askForMission = async (req, res) => {
  try {
    const newMission = await createNewMission(req.user, req.body, true);
    sendMissionEmail(
      newMission.recipient,
      "Tristan vous demande de collaborer",
      `Bonjour, Tristan vous demande de payer ${newMission.amount}€. Cliquez sur le lien suivant pour payer directement : ${newMission.paymentLink}`
    );
    res.status(201).json({
      message: "Lien de paiement envoyé avec succès",
      missionId: newMission.id,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la demande de mission.", error });
  }
};

export const acceptMission = async (req, res) => {
  try {
    const mission = await updateMissionStatus(
      req.params.id,
      req.user.sub,
      "accepted"
    );
    res.status(200).json({ message: "Mission acceptée avec succès.", mission });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de l'acceptation de la mission.", error });
  }
};

export const rejectMission = async (req, res) => {
  try {
    const mission = await updateMissionStatus(req.params.id, null, "cancelled");
    await handleMissionRefund(mission);
    res.status(200).json({ message: "Mission annulée avec succès.", mission });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de l'annulation de la mission.", error });
  }
};

export const completeMissionsToday = async (req, res) => {
  try {
    const completedMissions = await handleMissionPayment("complete");
    res
      .status(200)
      .json({ message: "Missions complétées avec succès", completedMissions });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la mise à jour des missions.", error });
  }
};

export const payMissionsToday = async (req, res) => {
  try {
    const paidMissions = await handleMissionPayment("pay");
    res
      .status(200)
      .json({ message: "Paiements effectués avec succès", paidMissions });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors du paiement des missions.", error });
  }
};

export const createDispute = async (req, res) => {
  try {
    const mission = await updateMissionStatus(
      req.params.id,
      req.user.sub,
      "disputed"
    );
    res.status(200).json({ message: "Mission disputée avec succès.", mission });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la création du litige.", error });
  }
};

export const getDisputedMission = async (req, res) => {
  try {
    const dispute = await Dispute.findOne({ missionId: req.params.id });
    if (!dispute) {
      return res.status(404).json({ message: "Litige non trouvé" });
    }
    res.json(dispute);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération du litige.", error });
  }
};
