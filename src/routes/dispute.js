import express from "express";

import { multerUpload, checkJwt } from "../middlewares/middleware.js";
import Mission from "../models/missionModel.js";

import { refundToCustomer } from "../services/stripeServices.js";
import { sendEmail } from "../services/emailServices.js";

import { handleUploadedFile } from "../utils/helpers.js";
import { signedS3Url } from "../utils/aws.js";

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

router.post("/create", checkJwt, multerUpload, async (req, res) => {
  const body = req.body;

  const mission = await Mission.findById(body.missionId).exec();
  if (!mission) {
    return res.status(404).json({ message: "Mission not found" });
  }

  let handledFile;
  try {
    handledFile = await handleUploadedFile(req.file);
  } catch (error) {
    return res.status(500).json({ message: "Error while uploading file" });
  }

  mission.dispute.messages.push({
    from_user_sub: req.user.sub,
    message: body.message,
    file: handledFile,
  });

  if (mission.status === "completed") {
    sendEmail(
      mission.recipient,
      "Litige en cours",
      `Bonjour, un litige a été ouvert pour la mission ${mission.description}.`
    );
    mission.status = "disputed";
    mission.dispute.status = "open";
  }
  await mission.save();

  return res.status(200).json({
    message: "Dispute updated successfully.",
    missionId: mission.id,
  });
});

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
    mission.dispute.status = "completed";
    await mission.save();
    return res.status(200).json({
      message: "Mission closed successfully.",
    });
  }
);

export default router;
