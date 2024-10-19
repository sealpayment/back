import express from "express";

import { checkJwt } from "../utils/auth.js";
import { createStripePaymentLink } from "../services/stripeServices.js";
import Mission from "../models/missionModel.js";

const router = express.Router();
router.get("/", checkJwt, async ({ user }, res) => {
  const missions = await Mission.find({
    $or: [{ from_user_sub: user.sub }, { to_user_sub: user.sub }],
  }).exec();
  return res.json(missions);
});

export default router;
