import express from "express";
import CryptoJS from "crypto-js";
import bcrypt from "bcrypt";

import { User } from "../models/userModel.js";
import { generateAccessToken, getTokenPayload } from "../utils/helpers.js";
import { createConnectedAccount } from "../services/stripeServices.js";
import { sendEmailWithTemplateKey } from "../services/emailServices.js";
import Mission from "../models/missionModel.js";
import { Token } from "../models/tokenModel.js";

const router = express.Router();

const { PUBLIC_AUTH_KEY, WEBSITE_URL } = process.env;

router.post("/sign-in", async (req, res) => {
  const { email, password } = req.body;
  let decryptedPassword;
  try {
    const bytes = CryptoJS.AES.decrypt(password, PUBLIC_AUTH_KEY);
    decryptedPassword = bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Erreur de décryptage du mot de passe" });
  }
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
  let decryptedPassword;
  try {
    const bytes = CryptoJS.AES.decrypt(password, PUBLIC_AUTH_KEY);
    decryptedPassword = bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Erreur de décryptage du mot de passe" });
  }
  const user = await User.findOne({ email });
  if (!user) {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(decryptedPassword, salt);
    let connectedAccount;
    try {
      connectedAccount = await createConnectedAccount(req.body);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
    const newUser = new User({
      ...req.body,
      password: passwordHash,
      connected_account_id: connectedAccount.id,
    });
    await newUser.save();

    const receivedMissions = await Mission.find({
      recipient: email,
    });
    for (const mission of receivedMissions) {
      if (mission.type === "ask") {
        mission.from_user_sub = newUser.id;
      } else {
        mission.to_user_sub = newUser.id;
      }
      await mission.save();
    }
    const token = generateAccessToken({
      user_id: newUser.id,
      user_email: email,
    });
    sendEmailWithTemplateKey(
      newUser.email,
      "signupSuccess",
      {},
      {
        first_name: newUser.firstName,
        last_name: newUser.lastName,
      }
    );
    return res.status(200).json({
      accessToken: token,
    });
  }
  res.status(400).json({ message: "This email is already used" });
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    const token = generateAccessToken({
      user_id: user.id,
      user_email: email,
    });
    sendEmailWithTemplateKey(
      user.email,
      "forgotPassword",
      {},
      {
        name: user.firstName,
        token,
      }
    );
    return res.status(200).json({ message: "Email sent" });
  }
  res.status(400).json({ message: "This email is not registered" });
});

router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;
  let decryptedPassword;
  try {
    const bytes = CryptoJS.AES.decrypt(password, PUBLIC_AUTH_KEY);
    decryptedPassword = bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Erreur de décryptage du mot de passe" });
  }
  try {
    const { user_id } = getTokenPayload(token);
    const user = await User.findById(user_id);
    const linkAlreadyUsed = await Token.findOne({
      type: "reset-password",
      token,
    });
    if (user && !linkAlreadyUsed) {
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(decryptedPassword, salt);
      user.password = passwordHash;
      new Token({ type: "reset-password", token }).save();
      await user.save();
      return res.status(200).json({ message: "Password updated" });
    }
    res.status(400).json({ message: "Invalid token" });
  } catch (error) {
    res.status(400).json({ message: "Invalid token" });
  }
});

router.get("/confirm-email", async (req, res) => {
  const { token } = req.query;
  try {
    const { user_id } = getTokenPayload(token);
    const user = await User.findById(user_id);
    if (user) {
      user.emailVerified = true;
      await user.save();
      sendEmailWithTemplateKey(
        user.email,
        "signupSuccess",
        {},
        {
          name: user.firstName,
        }
      );
      return res.redirect(`${process.env.WEBSITE_URL}/mission`);
    }
  } catch (error) {
    res.status(400).json({ message: "Invalid token" });
  }
});

export default router;
