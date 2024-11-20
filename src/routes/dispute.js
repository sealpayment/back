import express from "express";
import multer from "multer";
import path from "path";

import { checkJwt, getUser } from "../utils/auth.js";

import Dispute from "../models/disputeModel.js";
import Mission from "../models/missionModel.js";

import { refundToCustomer } from "../services/stripeServices.js";
import { sendEmail } from "../services/emailServices.js";

import { handleUploadedFile } from "../utils/helpers.js";
import { uploadFile, signedS3Url } from "../utils/aws.js";

const __dirname = path.resolve();

const router = express.Router();
const uploadDir = path.join(__dirname, "src", "tmp");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

router.get("/", checkJwt, async ({ user }, res) => {
  const userFound = await getUser(user.sub);
  if (userFound.user_metadata.isAdmin === false) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const missions = await Mission.find({ status: "disputed" }).exec();
  res.json(missions);
});

router.get("/:id", checkJwt, async (req, res) => {
  const missionId = req.params.id;
  const dispute = await Dispute.findOne({ missionId }).exec();
  if (!dispute) {
    return res.status(404).json({ message: "Dispute not found" });
  }
  dispute.messages = await Promise.all(
    dispute.messages.map(async (message) => {
      if (message.file) {
        const signedUrl = await signedS3Url("bindpay-app", message.file);
        message.file = signedUrl;
      }
      return message;
    })
  );
  res.json(dispute);
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single("file");

function handleMulterUpload(req, res, next) {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return handleError(res, 400, "Erreur de téléchargement de fichier", err);
    } else if (err) {
      return handleError(res, 500, "Erreur serveur", err);
    }
    next();
  });
}

router.post("/create", checkJwt, handleMulterUpload, async (req, res) => {
  const body = req.body;

  const mission = await Mission.findById(body.missionId).exec();
  if (!mission) {
    return res.status(404).json({ message: "Mission not found" });
  }

  let handledFile;
  try {
    handledFile = await handleUploadedFile(req.file);
  } catch (error) {
    return handleError(res, 500, "Erreur serveur", error);
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
    const userFound = await getUser(user.sub);
    if (userFound.user_metadata.isAdmin === false) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const missionId = params.missionId;
    const dispute = await Dispute.findOne({ missionId }).exec();
    if (!dispute) {
      return res.status(404).json({ message: "Dispute not found" });
    }

    if (dispute.from_user_sub === body.winnerUserId) {
      const mission = await Mission.findById(missionId).exec();
      await refundToCustomer(mission.paymentIntentId, mission.amount * 100);
      mission.status = "refund";
      await mission.save();
    } else {
      await Mission.findByIdAndUpdate(
        missionId,
        {
          status: "complete",
        },
        { new: true }
      ).exec();
    }

    return res.status(200).json({
      message: "Mission closed successfully.",
    });
  }
);

export default router;
