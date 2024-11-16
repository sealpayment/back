import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import { checkJwt, getUser } from "../utils/auth.js";

import Dispute from "../models/disputeModel.js";
import Mission from "../models/missionModel.js";

import dayjs from "dayjs";
import { sendEmail } from "../services/emailServices.js";
import { uploadFile, signedS3Url } from "../utils/aws.js";
import { User } from "../models/userModel.js";
import {
  refundToCustomer,
  transferToConnectedAccount,
} from "../services/stripeServices.js";

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

router.post("/create", checkJwt, (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        message: "Erreur de téléchargement de fichier",
        error: err.message,
      });
    } else if (err) {
      return res
        .status(500)
        .json({ message: "Erreur serveur", error: err.message });
    }

    const dispute = req.body;
    let existingDispute;
    let handledFile = null;
    if (req.file) {
      handledFile = await uploadFile(
        req.file.path,
        "bindpay-app",
        req.file.filename,
        req.file.mimetype
      );

      await fs.promises.unlink(req.file.path);
    }

    try {
      existingDispute = await Dispute.findOne({
        missionId: dispute.missionId,
      }).exec();
      if (existingDispute) {
        existingDispute.messages.push({
          from_user_sub: req.user.sub,
          message: dispute.message,
          file: handledFile,
        });
        await existingDispute.save();
        return res.status(200).json({
          message: "Dispute updated successfully.",
          disputeId: existingDispute.id,
        });
      } else {
        const newDispute = new Dispute({
          missionId: dispute.missionId,
          from_user_sub: req.user.sub,
          endDate: dayjs().add(12, "hour"),
          messages: [
            {
              from_user_sub: req.user.sub,
              message: dispute.message,
              file: handledFile,
            },
          ],
        });
        await newDispute.save();

        const updatedMission = await Mission.findByIdAndUpdate(
          dispute.missionId,
          {
            status: "disputed",
          },
          { new: true }
        ).exec();

        sendEmail(
          updatedMission.recipient,
          "Litige en cours",
          `Bonjour, un litige a été ouvert pour la mission ${updatedMission.description}.`
        );

        return res.status(201).json({
          message: "Dispute created successfully.",
          disputeId: newDispute.id,
        });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error while processing the dispute.", error });
    }
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
