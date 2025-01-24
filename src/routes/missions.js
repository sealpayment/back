import express from "express";
import dayjs from "dayjs";
import axios from "axios";
import stripe from "stripe";

import { checkJwt } from "../utils/auth.js";
import {
  capturePaymentIntent,
  createStripePaymentLink,
  refundToCustomer,
  createStripeCustomer,
  createConnectedAccount
} from "../services/stripeServices.js";
import Mission from "../models/missionModel.js";
import { sendEmailWithTemplateKey } from "../services/emailServices.js";
import { User } from "../models/userModel.js";
import { currencyMap } from "../utils/helpers.js";

const WEBSITE_URL = process.env.WEBSITE_URL;

const router = express.Router();

router.get("/", checkJwt, async ({ user }, res) => {
  const missions = await Mission.find({
    $or: [{ fromUserSub: user?._id }, { toUserSub: user?._id }],
  })
    .sort({ endDate: -1 })
    .exec();
  return res.json(missions);
});

router.get("/test-deployment", (req, res) => {
  return res.json({
    message: "API is working correctly 2",
    timestamp: new Date().toISOString(),
  });
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
  const { providerCountry, ...mission } = body;
  let newMission;
  try {
    let recipientUser = await User.findOne({ email: mission.recipient });

    if (!recipientUser) {
      const { stripeConnectedAccountId } = await createConnectedAccount({
        email: mission.recipient,
        country: providerCountry || "FR",
      });
      const customer = await createStripeCustomer({
        email: mission.recipient,
      });
      recipientUser = new User({
        email: mission.recipient,
        stripeConnectedAccountId: stripeConnectedAccountId,
        stripeCustomerId: customer.id,
        hasMissionPendingBankAccount: true,
      });
      await recipientUser.save();

    }

    newMission = new Mission({
      ...mission,
      fromUserSub: user._id,
      toUserSub: recipientUser._id,

    });
    const link = await createStripePaymentLink(newMission, recipientUser);
    newMission.paymentLink = link;
    await newMission.save();
  } catch (error) {
    console.error("Error creating mission:", error);
    return res.status(500).json({
      message: "Error while creating the mission.",
      error: error.message,
    });
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
      fromUserSub: recipientUser?._id,
      toUserSub: user._id,
    });
    const link = await createStripePaymentLink(newMission, recipientUser);
    newMission.paymentLink = link;
    await newMission.save();
    try {
      sendEmailWithTemplateKey(
        mission.recipient,
        recipientUser?._id ? "paymentRequestUser" : "paymentRequestAnonymous",
        newMission
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
      const client = await User.findById(mission.fromUserSub);
      await refundToCustomer(mission.paymentIntentId, mission.amount * 100);
      sendEmailWithTemplateKey(client.email, "missionCancelled", mission);
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

import { APIClient, SendEmailRequest } from "customerio-node";
const client = new APIClient("270f444061d559d5a7c6094282e63a90");

router.post("/test", async (req, res) => {
  const request = new SendEmailRequest({
    transactional_message_id: 2,
    identifiers: {
      id: "tristan.luong@gmail.com",
    },
    to: "tristan.luong@gmail.com",
    message_data: {
      first_name: "Tristan",
    },
  });

  client
    .sendEmail(request)
    .then((res) => console.log(res))
    .catch((err) => console.log(err.statusCode, err.message));
  res.status(200).json({ message: "Email sent successfully" });
});

export default router;
