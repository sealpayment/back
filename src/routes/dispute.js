import express from "express";

import { multerUpload, checkJwt } from "../middlewares/middleware.js";
import Mission from "../models/missionModel.js";

import {
  capturePaymentIntent,
  refundToCustomer,
} from "../services/stripeServices.js";
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
      fromUserSub: user._id,
      message: body.message,
      file: handledFile,
    });
    mission.status = "disputed";
    mission.dispute.status = "open";
    await mission.save();
    const client = await User.findById(mission.fromUserSub);
    const provider = await User.findById(mission.toUserSub);
    if (mission.dispute.messages.length === 1) {
      sendEmailWithTemplateKey(client.email, "disputeOpenedClient", mission);
      sendEmailWithTemplateKey(
        provider.email,
        "disputeOpenedProvider",
        mission
      );
    }
    if (mission.dispute.messages.length === 2) {
      sendEmailWithTemplateKey(provider.email, "disputeAnswered", mission);
      sendEmailWithTemplateKey(client.email, "disputeAnswered", mission);
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
      await refundToCustomer(mission.paymentIntentId);
      mission.status = "refund";
    } else {
      await capturePaymentIntent(mission.paymentIntentId);
      mission.status = "paid";
    }
    const client = await User.findById(mission.fromUserSub);
    const provider = await User.findById(mission.toUserSub);
    sendEmailWithTemplateKey(client.email, "disputeReviewed", mission, {
      outcome_description:
        body.action === "refund"
          ? "Funds have been refunded to your payment method."
          : "Funds have been released to the provider.",
    });
    sendEmailWithTemplateKey(provider.email, "disputeReviewed", mission, {
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

export default router;
