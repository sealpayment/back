import express from "express";

import { checkJwt } from "../utils/auth.js";

import Dispute from "../models/disputeModel.js";
import Mission from "../models/missionModel.js";

import dayjs from "dayjs";

const router = express.Router();

router.get("/:id", async (req, res) => {
  const missionId = req.params.id;
  const dispute = await Dispute.findOne({ missionId }).exec();
  if (!dispute) {
    return res.status(404).json({ message: "Dispute not found" });
  }
  res.json(dispute);
});

router.post("/create", checkJwt, async (req, res) => {
  const dispute = req.body;
  let existingDispute;
  try {
    existingDispute = await Dispute.findOne({
      missionId: dispute.missionId,
    }).exec();
    if (existingDispute) {
      // Mise à jour du litige existant
      existingDispute.messages.push({
        from_user_sub: req.user.sub,
        message: dispute.message,
        file: dispute.file,
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
            file: dispute.file,
          },
        ],
      });
      await newDispute.save();

      await Mission.findByIdAndUpdate(
        dispute.missionId,
        {
          status: "disputed",
        },
        { new: true }
      ).exec();

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

export default router;
