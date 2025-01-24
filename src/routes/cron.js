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
const EXPRESS_MODE = process.env.EXPRESS_MODE === "true";

const router = express.Router();

router.post("/should-remind", async (req, res) => {
  const now = dayjs();
  try {
    const missions = await Mission.find({
      status: "active",
      reminderSent: false,
    });
    for (const m of missions) {
      const diff = dayjs(m.endDate).diff(now, EXPRESS_MODE ? "minute" : "hour");
      if (EXPRESS_MODE ? diff < 3 : diff < 72) {
        m.reminderSent = true;
        await m.save();
        const provider = await User.findById(m.toUserSub);
        const providerEmail =
          m?.type === "send" ? m.recipient : provider?.email;
        sendEmailWithTemplateKey(providerEmail, "missionReminder", m);
      }
    }
    res.status(200).json({
      message: `Reminders sent successfully`,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de l'envoi des reminders.",
      error: error.message,
    });
  }
});

router.post("/should-complete", async (req, res) => {
  const now = dayjs();
  try {
    const missions = await Mission.find({
      status: "active",
      reminderSent: true,
    });
    for (const m of missions) {
      const diff = dayjs(m.endDate).diff(now, EXPRESS_MODE ? "minute" : "hour");
      if (EXPRESS_MODE ? diff < 2 : diff < 48) {
        m.status = "completed";
        await m.save();
        const client = await User.findById(m?.fromUserSub);
        const clientEmail = m?.type === "send" ? client?.email : m.recipient;
        sendEmailWithTemplateKey(clientEmail, "missionCompletedClient", m);
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
    const missions = await Mission.find({
      status: "completed",
    });
    for (const m of missions) {
      const diff = dayjs(m.endDate).diff(now, EXPRESS_MODE ? "minute" : "hour");
      if (EXPRESS_MODE ? diff < 1 : diff < 36) {
        const client = await User.findById(m?.fromUserSub);
        const provider = await User.findById(m?.toUserSub);
        await capturePaymentIntent(m.paymentIntentId);
        m.status = "paid";
        await m.save();
        const clientEmail = m?.type === "send" ? client?.email : m.recipient;
        sendEmailWithTemplateKey(clientEmail, "paymentReleasedClient", m);
        const providerEmail =
          m?.type === "send" ? m.recipient : provider?.email;
        sendEmailWithTemplateKey(providerEmail, "missionCompletedProvider", m);
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
      return dayjs(mission.dispute.endDate).diff(
        now,
        EXPRESS_MODE ? "minute" : "hour"
      ) <= EXPRESS_MODE
        ? 0
        : 12;
    });
    for (const mD of disputed) {
      const providerHasResponded = mD.dispute.messages.some(
        (message) => message.fromUserSub === mD.toUserSub
      );
      if (!providerHasResponded) {
        const client = await User.findById(mD?.fromUserSub);
        const provider = await User.findById(mD?.toUserSub);
        await refundToCustomer(mD.paymentIntentId);
        mD.status = "refund";
        await mD.save();
        const clientEmail = m?.type === "send" ? client?.email : m.recipient;
        const providerEmail =
          m?.type === "send" ? m.recipient : provider?.email;
        sendEmailWithTemplateKey(clientEmail, "disputeReviewed", mD);
        sendEmailWithTemplateKey(providerEmail, "disputeNoAnswer", mD);
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
