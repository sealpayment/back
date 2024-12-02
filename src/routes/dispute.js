import express from "express";

import { multerUpload, checkJwt } from "../middlewares/middleware.js";
import Mission from "../models/missionModel.js";

import { refundToCustomer } from "../services/stripeServices.js";
import { sendEmailWithTemplateKey } from "../services/emailServices.js";

import { currencyMap, handleUploadedFile } from "../utils/helpers.js";
import { signedS3Url } from "../utils/aws.js";
import { User } from "../models/userModel.js";
import dayjs from "dayjs";

const router = express.Router();

router.get("/", checkJwt, async ({ user }, res) => {
  if (user?.isAdmin === false) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const missions = await Mission.find({ status: "disputed" }).exec();
  res.json(missions);
});

// router.get("/:id", checkJwt, async (req, res) => {
//   const missionId = req.params.id;
//   const dispute = await Dispute.findOne({ missionId }).exec();
//   if (!dispute) {
//     return res.status(404).json({ message: "Dispute not found" });
//   }
//   dispute.messages = await Promise.all(
//     dispute.messages.map(async (message) => {
//       if (message.file) {
//         const signedUrl = await signedS3Url("bindpay-app", message.file);
//         message.file = signedUrl;
//       }
//       return message;
//     })
//   );
//   res.json(dispute);
// });

router.post(
  "/create",
  checkJwt,
  multerUpload,
  async ({ user, file, body }, res) => {
    const mission = await Mission.findById(body.missionId).exec();
    if (!mission) {
      return res.status(404).json({ message: "Mission not found" });
    }
    let handledFile;
    try {
      handledFile = await handleUploadedFile(file);
    } catch (error) {
      return res.status(500).json({ message: "Error while uploading file" });
    }
    mission.dispute.messages.push({
      from_user_sub: user.sub,
      message: body.message,
      file: handledFile,
    });
    mission.status = "disputed";
    mission.dispute.status = "open";
    await mission.save();
    const client = await User.findById(mission.from_user_sub);
    const provider = await User.findById(mission.to_user_sub);
    if (mission.dispute.messages.length === 1) {
      sendEmailWithTemplateKey(client.email, "disputeOpenedClient", {
        name: client.firstName,
        currency: currencyMap[mission.currency],
        amount: mission.amount,
        email: provider.email,
        action_url: `${process.env.WEBSITE_URL}/mission/dispute/${mission.id}`,
      });
      sendEmailWithTemplateKey(provider.email, "disputeOpenedProvider", {
        name: provider.firstName,
        currency: currencyMap[mission.currency],
        amount: mission.amount,
        email: client.email,
        action_url: `${process.env.WEBSITE_URL}/mission/dispute/${mission.id}`,
        mission_id: mission.id,
      });
    }
    if (mission.dispute.messages.length === 2) {
      sendEmailWithTemplateKey(provider.email, "disputeAnswered", {
        name: provider.firstName,
        currency: currencyMap[mission.currency],
        amount: mission.amount,
        mission_id: mission.id,
      });
      sendEmailWithTemplateKey(client.email, "disputeAnswered", {
        name: client.firstName,
        currency: currencyMap[mission.currency],
        amount: mission.amount,
        mission_id: mission.id,
        resolution_deadline: dayjs(mission.endDate).format("MMMM DD, YYYY"),
      });
    }
    return res.status(200).json({
      message: "Dispute updated successfully.",
      missionId: mission.id,
    });
  }
);

router.post(
  "/:missionId/close",
  checkJwt,
  async ({ user, params, body }, res) => {
    if (user?.isAdmin === false) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const mission = await Mission.findById(params.missionId).exec();
    if (!mission) {
      return res.status(404).json({ message: "Mission not found" });
    }
    if (body.action === "refund") {
      await refundToCustomer(mission.paymentIntentId, mission.amount * 100);
      mission.status = "refund";
    } else {
      mission.status = "paid";
    }
    const client = await User.findById(mission.from_user_sub);
    const provider = await User.findById(mission.to_user_sub);
    sendEmailWithTemplateKey(client.email, "disputeReviewed", {
      name: client.firstName,
      amount: mission.amount.toFixed(2),
      currency: currencyMap[mission.currency],
      email: provider.email,
      outcome_description:
        body.action === "refund"
          ? "Funds have been refunded to your payment method."
          : "Funds have been released to the provider.",
    });
    sendEmailWithTemplateKey(provider.email, "disputeReviewed", {
      name: provider.firstName,
      amount: mission.amount.toFixed(2),
      currency: currencyMap[mission.currency],
      email: client.email,
      outcome_description:
        body.action === "refund"
          ? "Funds have been refunded to the client's payment method."
          : "Funds have been released to you.",
    });
    mission.dispute.status = "completed";
    await mission.save();
    return res.status(200).json({
      message: "Mission closed successfully.",
    });
  }
);

router.post("/check-disputes", async (req, res) => {
  const now = dayjs();
  const twelveHoursAgo = now.subtract(12, "hour");
  try {
    const missions = await Mission.find({
      $expr: {
        $and: [
          {
            $gte: ["$endDate", twelveHoursAgo.toDate()],
          },
          { $lt: ["$endDate", now.toDate()] },
        ],
      },
      status: "disputed",
    });
    for (const mission of missions) {
      const providerHasResponded = mission.dispute.messages.some(
        (message) => message.from_user_sub === mission.to_user_sub
      );
      if (!providerHasResponded) {
        const client = await User.findById(mission.from_user_sub);
        const provider = await User.findById(mission.to_user_sub);
        await refundToCustomer(mission.paymentIntentId, mission.amount * 100);
        mission.status = "refund";
        await mission.save();
        sendEmailWithTemplateKey(provider.email, "disputeNoAnswer", {
          client_first_name: provider.firstName,
          mission_id: mission.id,
          currency: currencyMap[mission.currency],
          amount: mission.amount.toFixed(2),
        });
        sendEmailWithTemplateKey(client.email, "disputeReviewed", {
          name: client.firstName,
          amount: mission.amount.toFixed(2),
          currency: currencyMap[mission.currency],
          email: provider.email,
          outcome_description:
            "Funds have been refunded to your payment method due to no response from the provider.",
        });
      }
    }
    res.status(200).json({ message: "Missions completed successfully." });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error while completing the missions.", error: err });
  }
});

export default router;
