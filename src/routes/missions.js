import express from "express";
import dayjs from "dayjs";

import { checkJwt } from "../utils/auth.js";
import {
  createStripePaymentLink,
  refundToCustomer,
} from "../services/stripeServices.js";
import Mission from "../models/missionModel.js";
import { sendEmailWithTemplateKey } from "../services/emailServices.js";
import { User } from "../models/userModel.js";
import { currencyMap } from "../utils/helpers.js";

const WEBSITE_URL = process.env.WEBSITE_URL;

const router = express.Router();

router.get("/", checkJwt, async ({ user }, res) => {
  const missions = await Mission.find({
    $or: [{ from_user_sub: user?._id }, { to_user_sub: user?._id }],
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
    try {
      console.log("link", link);
      sendEmailWithTemplateKey(
        mission.recipient,
        recipientUser?._id ? "paymentRequestUser" : "paymentRequestAnonymous",
        {
          name: recipientUser?.firstName ?? mission.recipient,
          provider_email: user.email,
          currency: currencyMap[mission.currency],
          amount: parseFloat(mission.amount).toFixed(2),
          details: mission.description,
          action_link: recipientUser?._id
            ? link
            : `${WEBSITE_URL}/auth/register`,
        }
      );
    } catch (error) {
      console.log("Error while sending email", error);
    }
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
      const client = await User.findById(mission.from_user_sub);
      const provider = await User.findById(mission.to_user_sub);
      await refundToCustomer(mission.paymentIntentId, mission.amount * 100);
      sendEmailWithTemplateKey(client.email, "missionCancelled", {
        name: client.firstName,
        currency: currencyMap[mission.currency],
        amount: mission.amount.toFixed(2),
        provider_email: provider.email,
      });
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
      const client = await User.findById(mission.from_user_sub);
      const provider = await User.findById(mission.to_user_sub);
      sendEmailWithTemplateKey(client.email, "missionCompletedClient", {
        name: client.firstName,
        provider_email: provider.email,
        currency: currencyMap[mission.currency],
        amount: mission.amount.toFixed(2),
        action_title: "Open a Dispute",
        action_url: `${WEBSITE_URL}/mission/dispute/${mission.id}`,
      });
      sendEmailWithTemplateKey(provider.email, "missionCompletedProvider", {
        name: provider.firstName,
        currency: currencyMap[mission.currency],
        amount: mission.amount.toFixed(2),
        client_first_name: client.firstName,
        mission_id: mission.id,
      });
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

router.post("/clients-reminder", async (req, res) => {
  const now = dayjs();
  const seventyTwoHoursAgo = now.subtract(72, "hour");
  const fortyEightHoursAgo = now.subtract(48, "hour");
  try {
    const missions = await Mission.find({
      $expr: {
        $and: [
          {
            $gte: ["$endDate", seventyTwoHoursAgo.toDate()],
          },
          { $lt: ["$endDate", fortyEightHoursAgo.toDate()] },
        ],
      },
      status: "active",
      reminderSent: { $ne: true },
    });
    for (const mission of missions) {
      const client = await User.findById(mission.from_user_sub);
      sendEmailWithTemplateKey(client.email, "missionReminder", {
        name: client.firstName,
        mission_id: mission.id,
      });
      mission.reminderSent = true;
      await mission.save();
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

router.post("/test", async (req, res) => {
  const key = req.body.key;
  await sendEmailWithTemplateKey("tristan.luong@gmail.com", key, req.body);
  res.status(200).json({
    message: `Email sent successfully`,
  });
});

export default router;
