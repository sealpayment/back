import express from "express";
import dayjs from "dayjs";

import {
  capturePaymentIntent,
  refundToCustomer,
} from "../services/stripeServices.js";
import Mission from "../models/missionModel.js";
import { sendEmailWithTemplateKey } from "../services/emailServices.js";
import { User } from "../models/userModel.js";
import { currencyMap } from "../utils/helpers.js";

const WEBSITE_URL = process.env.WEBSITE_URL;

const router = express.Router();

router.post("/should-remind", async (req, res) => {
  const now = dayjs();
  try {
    const missions = await Mission.find({ status: "active" });
    const actives = missions.filter((mission) => {
      const endDate = dayjs(mission.endDate);
      const diff = endDate.diff(now, "hour");
      return diff > 96 && diff < 120 && !mission.reminderSent;
    });
    for (const m of actives) {
      const client = await User.findById(m.from_user_sub);
      sendEmailWithTemplateKey(client?.email, "missionReminder", {
        name: client.firstName,
        mission_id: m.id,
      });
      m.reminderSent = true;
      await m.save();
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

router.post("/should-complete", async (req, res) => {
  const now = dayjs();
  try {
    const missions = await Mission.find({ status: "active" });
    const actives = missions.filter((mission) => {
      return dayjs(mission.endDate).diff(now, "hour") < 48;
    });
    for (const m of actives) {
      m.status = "completed";
      await m.save();
      const client = await User.findById(m?.from_user_sub);
      const provider = await User.findById(m?.to_user_sub);
      if (client?.email) {
        sendEmailWithTemplateKey(client?.email, "missionCompletedClient", {
          name: client?.firstName,
          provider_email: provider?.email,
          currency: currencyMap[m.currency],
          amount: m.amount.toFixed(2),
          action_title: "Open a Dispute",
          action_url: `${WEBSITE_URL}/mission/dispute/${m.id}`,
        });
      }
      if (provider?.email) {
        sendEmailWithTemplateKey(provider?.email, "missionCompletedProvider", {
          name: provider?.firstName,
          currency: currencyMap[m.currency],
          amount: m.amount.toFixed(2),
          client_first_name: client?.firstName,
          mission_id: m.id,
        });
      }
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

router.post("/should-pay", async (req, res) => {
  const now = dayjs();
  try {
    const missions = await Mission.find({ status: "completed" });
    const completed = missions.filter((mission) => {
      return dayjs(mission.endDate).diff(now, "hour") < 36;
    });
    for (const m of completed) {
      const client = await User.findById(m?.from_user);
      const provider = await User.findById(m?.to_user);
      await capturePaymentIntent(m.paymentIntentId);
      m.status = "paid";
      await m.save();
      if (client?.email) {
        sendEmailWithTemplateKey(client?.email, "missionCompletedClient", {
          name: client?.firstName,
          provider_email: provider?.email,
          currency: currencyMap[m.currency],
          amount: m.amount.toFixed(2),
          action_title: "Open a Dispute",
          action_url: `${WEBSITE_URL}/mission/dispute/${m.id}`,
        });
      }
      if (provider?.email) {
        sendEmailWithTemplateKey(provider?.email, "missionCompletedProvider", {
          name: provider?.firstName,
          currency: currencyMap[m.currency],
          amount: m.amount.toFixed(2),
          client_first_name: client?.firstName,
          mission_id: m.id,
        });
      }
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

router.post("/check-disputes", async (req, res) => {
  const now = dayjs();
  try {
    const missions = await Mission.find({ status: "disputed" });
    const disputed = missions.filter((mission) => {
      return dayjs(mission.dispute.endDate).diff(now, "hour") < 12;
    });
    for (const mD of disputed) {
      const providerHasResponded = mD.dispute.messages.some(
        (message) => message.from_user_sub === mD.to_user_sub
      );
      if (!providerHasResponded) {
        const client = await User.findById(mD?.from_user_sub);
        const provider = await User.findById(mD?.to_user_sub);
        await refundToCustomer(mD.paymentIntentId);
        mD.status = "refund";
        await mD.save();
        sendEmailWithTemplateKey(provider?.email, "disputeNoAnswer", {
          client_first_name: provider.firstName,
          mission_id: mD.id,
          currency: currencyMap[mD.currency],
          amount: mD.amount.toFixed(2),
        });
        sendEmailWithTemplateKey(client?.email, "disputeReviewed", {
          name: client.firstName,
          amount: mD.amount.toFixed(2),
          currency: currencyMap[mD.currency],
          email: provider.email,
          outcome_description:
            "Funds have been refunded to your payment method due to no response from the provider.",
        });
      }
    }
    res.status(200).json({ message: "Disputes checked successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error while checking disputes", error: err.message });
  }
});

export default router;
