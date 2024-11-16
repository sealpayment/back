import Mission from "../models/missionModel.js";
import {
  createStripePaymentLink,
  refundToCustomer,
  transferToConnectedAccount,
} from "./stripeServices.js";
import { sendEmail } from "./emailServices.js";
import { User } from "../models/userModel.js";
import dayjs from "dayjs";

export const findMissions = async (userSub) => {
  return await Mission.find({
    $or: [{ from_user_sub: userSub }, { to_user_sub: userSub }],
  })
    .sort({ endDate: -1 })
    .exec();
};

export const findMissionById = async (missionId) => {
  return await Mission.findById(missionId).exec();
};

export const createNewMission = async (
  user,
  missionData,
  isRequest = false
) => {
  const knownUser = await User.findOne({ email: missionData.recipient });
  const newMission = new Mission({
    ...missionData,
    from_user_sub: user.sub,
    to_user_sub: knownUser?.user_id,
  });

  if (!isRequest && user.connected_account_id && missionData.useDeposit) {
    await transferToConnectedAccount(
      user.connected_account_id,
      parseFloat(missionData.amount.replace(",", ".")) * 100
    );
    newMission.status = "active";
    newMission.endDate = dayjs().add(7, "minutes").set("second", 0).toDate();
  } else {
    const link = await createStripePaymentLink(newMission);
    newMission.paymentLink = link;
  }

  await newMission.save();
  return newMission;
};

export const updateMissionStatus = async (missionId, userSub, status) => {
  const mission = await Mission.findById(missionId);
  if (!mission) throw new Error("Mission non trouvée");
  if (userSub) mission.to_user_sub = userSub;
  mission.status = status;
  await mission.save();
  return mission;
};

export const sendMissionEmail = (recipient, subject, message) => {
  sendEmail(recipient, subject, message);
};

export const handleMissionPayment = async (action) => {
  const now = new Date();
  const missions = await Mission.find({
    $expr:
      action === "complete"
        ? {
            $and: [
              { $gte: ["$endDate", now] },
              { $lt: ["$endDate", new Date(now.getTime() + 2 * 60 * 1000)] },
            ],
          }
        : { $lt: ["$endDate", now] },
    status: action === "complete" ? "active" : "complete",
  });

  for (const mission of missions) {
    if (action === "complete") {
      mission.status = "complete";
      sendMissionEmail(
        mission.recipient,
        "Votre mission se termine bientôt",
        "Bonjour, votre mission se termine bientôt. Vous recevrez votre paiement dans les prochaines 48 heures si le destinataire ne signale pas de problème."
      );
    } else {
      const receiver = await User.findOne({ sub: mission.to_user_sub });
      if (!receiver) {
        await handleMissionRefund(mission);
        continue;
      }
      await transferToConnectedAccount(
        receiver.connected_account_id,
        mission.amount * 100
      );
      mission.status = "paid";
      sendMissionEmail(
        mission.recipient,
        "Mission terminée",
        `Bonjour, votre paiement de ${mission.amount}€ est en cours. Vous recevrez l'argent sur votre balance Bindpay d'ici quelques instants.`
      );
    }
    await mission.save();
  }
  return missions;
};

export const handleMissionRefund = async (mission) => {
  try {
    const refund = await refundToCustomer(
      mission.paymentIntentId,
      mission.amount * 100
    );
    if (refund) {
      mission.status = "refund";
      await mission.save();
    }
  } catch (error) {
    console.error(
      `Erreur lors du remboursement pour la mission: ${mission.id}`,
      error
    );
  }
};
