import express from "express";
import CryptoJS from "crypto-js";
import fs from "fs";
import mustache from "mustache";

import { User } from "../models/userModel.js";
import { generateAccessToken, getTokenPayload } from "../utils/helpers.js";
import { sendEmail } from "../services/emailServices.js";
import translations from "../locales/index.js";

const router = express.Router();

router.post("/sign-in", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({
    email,
    password: CryptoJS.SHA256(password).toString(),
  });
  if (user) {
    const token = generateAccessToken(user.id);
    return res.status(200).json(token);
  }
  res.status(400).json({ message: "Invalid credentials" });
});

router.post("/sign-up", async (req, res) => {
  const { email, password } = req.body;
  const passwordHashed = CryptoJS.SHA256(password).toString();
  const user = await User.findOne({ email });
  if (!user) {
    const newUser = new User({
      email,
      password: passwordHashed,
    });
    await newUser.save();
    const token = generateAccessToken(newUser.id);
    return res.status(200).json({ accessToken: token });
  }
  res.status(400).json({ message: "User already exists" });
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const documentPath = fs.readFileSync(
    "./src/templates/forgot-password.html",
    "utf-8"
  );
  const user = await User.findOne({ email }).exec();
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }
  const token = generateAccessToken(user.id);
  const newPasswordLink = `${process.env.API_URL}/new-password?token=${token}`;
  const resetPasswordDocument = mustache.render(documentPath, {
    newPasswordLink,
    ...translations[user.language],
  });

  await sendEmail(
    email,
    translations[user.language].forgotPassword.title,
    resetPasswordDocument
  );
  res.status(200).json({ message: "New password link sent" });
});

router.post("/new-password", async (req, res) => {
  const { newPassword, confirmPassword, token } = req.body;
  const userId = getTokenPayload(token);
  const user = await User.findOne({ _id: userId }).exec();
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      message: translations[user.language].newPassword.passwordsMatch,
      error: true,
    });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({
      message: translations[user.language].newPassword.passwordLength,
      error: true,
    });
  }
  const newPasswordHash = CryptoJS.SHA256(newPassword).toString();
  user.password = newPasswordHash;
  try {
    await user.save();
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Error updating password", error: true });
  }
  return res.status(200).json({ message: "Password updated" });
});

export default router;
