import express from "express";
import CryptoJS from "crypto-js";
import bcrypt from "bcrypt";

import { User } from "../models/userModel.js";
import { generateAccessToken, getTokenPayload } from "../utils/helpers.js";
import {
  createConnectedAccountWithOnboarding,
  createStripeCustomer,
  deleteConnectedAccount,
} from "../services/stripeServices.js";
import { sendEmailWithTemplateKey } from "../services/emailServices.js";
import Mission from "../models/missionModel.js";
import { Token } from "../models/tokenModel.js";
import { updateConnectedAccountEmail } from "../services/stripeServices.js";

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
      isEmailVerified: user.emailVerified,
    });
  }
  res.status(400).json({ message: "Invalid credentials" });
});

router.post("/sign-up", async (req, res) => {
  const { email, password, accountType } = req.body;
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

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(decryptedPassword, salt);

  let finalUser;
  let accountLink;

  try {
    if (user) {
      // User exists - handle updates
      if (user.isRegistered) {
        return res
          .status(400)
          .json({ message: "This email is already registered" });
      }

      if (user.country !== req.body.country) {
        // Delete old Stripe Connected Account and create new one
        await deleteConnectedAccount(user.stripeConnectedAccountId);
        const { stripeConnectedAccountId, onboardingUrl } =
          await createConnectedAccountWithOnboarding(req.body);
        user.stripeConnectedAccountId = stripeConnectedAccountId;
        accountLink = onboardingUrl;
      } else if (user.stripeConnectedAccountId) {
        accountLink = await createAccountLink(user.stripeConnectedAccountId);
      }

      Object.assign(user, {
        ...req.body,
        password: passwordHash,
        isRegistered: true,
      });
      finalUser = user;
    } else {
      // New user case
      let connectedAccountId;
      let stripeCustomer;

      if (accountType === "receiver" || accountType === "both") {
        const [{ stripeConnectedAccountId, onboardingUrl }, customer] =
          await Promise.all([
            createConnectedAccountWithOnboarding(req.body),
            createStripeCustomer(req.body),
          ]);
        connectedAccountId = stripeConnectedAccountId;
        stripeCustomer = customer;
        accountLink = onboardingUrl;
      } else {
        stripeCustomer = await createStripeCustomer(req.body);
      }

      finalUser = new User({
        ...req.body,
        password: passwordHash,
        stripeConnectedAccountId: connectedAccountId,
        stripeCustomerId: stripeCustomer.id,
        isRegistered: true,
      });
    }

    await finalUser.save();

    const token = generateAccessToken({
      user_id: finalUser.id,
      user_email: email,
    });

    sendEmailWithTemplateKey(
      finalUser.email,
      "signupSuccess",
      {},
      {
        first_name: finalUser.firstName,
        last_name: finalUser.lastName,
        token,
      }
    );

    return res.status(200).json({
      accessToken: token,
      onboardingUrl: accountLink,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
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
        first_name: user.firstName,
        last_name: user.lastName,
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

router.post("/confirm-email", async (req, res) => {
  const { token } = req.body;
  try {
    const { user_id } = getTokenPayload(token);
    const user = await User.findById(user_id);
    if (user) {
      user.emailVerified = true;
      await user.save();
      return res.status(200).json({
        message: "Email confirmed",
        isEmailVerified: user.emailVerified,
      });
    }
  } catch (error) {
    res.status(400).json({ message: "Invalid token" });
  }
});

router.post("/confirm-new-email", async (req, res) => {
  const { token, newEmail } = req.body;
  try {
    const { user_id } = getTokenPayload(token);
    const user = await User.findById(user_id);

    // Check if another user already has this email
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "This email is already used by another account" });
    }

    if (user) {
      user.email = newEmail;
      await user.save();
      await updateConnectedAccountEmail(user.connected_account_id, newEmail);
      const token = generateAccessToken({
        user_id: user.id,
        user_email: newEmail,
      });
      return res.status(200).json({
        accessToken: token,
        message: "Email confirmed",
        isEmailVerified: user.emailVerified,
      });
    }
  } catch (error) {
    res.status(400).json({ message: "Invalid token" });
  }
});

export default router;
