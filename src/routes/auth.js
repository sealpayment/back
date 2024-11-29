import express from "express";
import CryptoJS from "crypto-js";
import bcrypt from "bcrypt";

import { User } from "../models/userModel.js";
import { generateAccessToken, getTokenPayload } from "../utils/helpers.js";
import {
  createConnectedAccount,
  linkAccountToConnectedAccount,
} from "../services/stripeServices.js";
import { sendEmailWithTemplate } from "../services/emailServices.js";
import Mission from "../models/missionModel.js";

const router = express.Router();

const { PUBLIC_AUTH_KEY } = process.env;

router.post("/sign-in", async (req, res) => {
  const { email, password } = req.body;
  const bytes = CryptoJS.AES.decrypt(password, PUBLIC_AUTH_KEY);
  const decryptedPassword = bytes.toString(CryptoJS.enc.Utf8);
  const user = await User.findOne({ email });
  if (user && bcrypt.compareSync(decryptedPassword, user.password)) {
    const token = generateAccessToken({
      user_id: user.id,
      user_email: user.email,
    });
    return res.status(200).json({
      accessToken: token,
    });
  }
  res.status(400).json({ message: "Invalid credentials" });
});

router.post("/sign-up", async (req, res) => {
  const { email, password } = req.body;
  const bytes = CryptoJS.AES.decrypt(password, PUBLIC_AUTH_KEY);
  const decryptedPassword = bytes.toString(CryptoJS.enc.Utf8);
  const user = await User.findOne({ email });
  if (!user) {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(decryptedPassword, salt);
    const connectedAccount = await createConnectedAccount(req.body);
    if (req.body.bankAccountToken)
      await linkAccountToConnectedAccount(
        req.body.bankAccountToken,
        connectedAccount.id
      );
    const newUser = new User({
      ...req.body,
      password: passwordHash,
      connected_account_id: connectedAccount.id,
    });
    await newUser.save();

    const receivedMissions = await Mission.find({
      recipient: email,
    });
    if (receivedMissions.length > 0) {
      await Mission.updateMany(
        {
          recipient: email,
        },
        {
          to_user_sub: newUser.id,
        }
      );
    }
    const token = generateAccessToken({
      user_id: newUser.id,
      user_email: email,
    });
    sendEmailWithTemplate(
      newUser.email,
      "Please confirm your email",
      "./src/templates/confirm-email.html",
      {
        first_name: newUser.firstName,
        email: newUser.email,
        verification_link: `${process.env.API_URL}/api/auth/confirm-email?token=${token}`,
      }
    );
    return res.status(200).json({
      accessToken: token,
    });
  }
  res.status(400).json({ message: "User already exists" });
});

router.get("/confirm-email", async (req, res) => {
  const { token } = req.query;
  const { user_id } = getTokenPayload(token);
  const user = await User.findById(user_id);
  if (user) {
    user.emailVerified = true;
    await user.save();
    sendEmailWithTemplate(
      user.email,
      "Welcome to Bindpay",
      "./src/templates/email-verified.html",
      {
        first_name: user.firstName,
        get_started_link: `${process.env.WEBSITE_URL}/mission`,
      }
    );
    return res.redirect(`${process.env.WEBSITE_URL}/mission`);
  }
  res.status(400).json({ message: "Invalid token" });
});

export default router;
