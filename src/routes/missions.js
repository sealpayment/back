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
  createConnectedAccount,
} from "../services/stripeServices.js";
import FormData from "form-data";
import Mailgun from "mailgun.js";

import Mission from "../models/missionModel.js";
import { sendEmailWithMailgunTemplate } from "../services/emailServices.js";
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
      const stripePaymentId = newMission?.paymentLink?.split("/").pop();

      sendEmailWithMailgunTemplate(
        mission.recipient,
        recipientUser?._id ? "paymentrequestuser" : "paymentrequestanonymous",
        newMission,
        {
          action_link: recipientUser?._id
            ? `https://checkout.stripe.com/c/pay/${stripePaymentId}`
            : `${process.env.WEBSITE_URL}/auth/register`,
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
      const client = await User.findById(mission.fromUserSub);
      await refundToCustomer(mission.paymentIntentId, mission.amount * 100);
      sendEmailWithMailgunTemplate(client.email, "missioncancelled", mission, {
        action_link: `${process.env.WEBSITE_URL}/mission`,
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

import { APIClient, SendEmailRequest } from "customerio-node";
const client = new APIClient("270f444061d559d5a7c6094282e63a90");

router.post("/test", async (req, res) => {
  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({
    username: "api",
    key: process.env.MAILGUN_API_KEY,
    url: process.env.MAILGUN_API_URL,
  });

  try {
    const data = await mg.messages.create(process.env.MAILGUN_DOMAIN, {
      from: `Seal Payment${process.env.EMAIL_FROM_ADDRESS}`,
      to: ["benoitpayet1989@gmail.com"],
      subject: "Hello Benoit",

      // html: "<h1>This is a test email</h1><p>Testing Mailgun integration</p>",
      template: "disputeopenedclient",
      "h:X-Mailgun-Variables": JSON.stringify({
        test: "test",
      }),
    });
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Mailgun error:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

export default router;
