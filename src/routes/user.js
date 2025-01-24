import express from "express";
import bcrypt from "bcrypt";
import CryptoJS from "crypto-js";

import { checkJwt } from "../utils/auth.js";
import { User } from "../models/userModel.js";
import { generateAccessToken } from "../utils/helpers.js";
import {
  updateConnectedAccount,
  uploadIdentityDocument,
  updateConnectedAccountEmail,
  updateStripeCustomerEmail,
} from "../services/stripeServices.js";
import { multerUpload } from "../middlewares/middleware.js";
import { sendEmailWithTemplateKey } from "../services/emailServices.js";
import Mission from "../models/missionModel.js";
import { checkAccountOnboardingStatus } from "../services/stripeServices.js";

const router = express.Router();

router.get("/me", checkJwt, async ({ user }, res) => {
  try {
    const userFound = user;
    delete userFound.password;
    res.status(200).json(userFound);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post(
  "/upload-identity",
  checkJwt,
  multerUpload,
  async ({ file }, res) => {
    try {
      const documentId = await uploadIdentityDocument(file);
      res.status(200).json({ documentId });
    } catch (error) {
      res.status(500).send(error.message);
    }
  }
);

router.post(
  "/update-connected-account",
  checkJwt,
  async ({ user, body }, res) => {
    try {
      const connectedAccount = await updateConnectedAccount(
        user.stripeConnectedAccountId,
        body.token
      );
      user.hasCompleted.identity = true;
      await user.save();
      res.status(200).json(connectedAccount);
    } catch (error) {
      res.status(500).send(error.message);
    }
  }
);

router.patch("/update-profile", checkJwt, async ({ user, body }, res) => {
  try {
    const updates = {};

    if (body.email) {
      // Check if email is already in use
      const existingUser = await User.findOne({ email: body.email });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "Email address is already in use" });
      }

      // if (user.stripeConnectedAccountId) {
      //   console.log("in connected account");
      //   await updateConnectedAccountEmail(
      //     user.stripeConnectedAccountId,
      //     body.email
      //   );
      // }

      // if (user.stripeCustomerId) {
      //   console.log("in customer");
      //   await updateStripeCustomerEmail(user.stripeCustomerId, body.email);
      // }

      const token = generateAccessToken({
        user_id: user.id,
        user_email: user.email,
      });
      sendEmailWithTemplateKey(
        body.email,
        "confirmNewEmail",
        {},
        {
          first_name: user.firstName,
          last_name: user.lastName,
          token,
          newEmail: body.email,
        }
      );
    }

    if (body.password) {
      // First decrypt the password using CryptoJS
      const bytes = CryptoJS.AES.decrypt(
        body.password,
        process.env.PUBLIC_AUTH_KEY
      );
      const decryptedPassword = bytes.toString(CryptoJS.enc.Utf8);

      // Hash password using the same method as auth.js
      const salt = bcrypt.genSaltSync(10);
      updates.password = bcrypt.hashSync(decryptedPassword, salt);
    }

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(user._id, updates, {
      new: true,
    });

    delete updatedUser.password;
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post("/check-email", checkJwt, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const emailExists = await User.findOne({ email: email });
    res.status(200).json({
      exists: !!emailExists,
      hasBankAccount: emailExists
        ? emailExists.hasCompleted.bankAccount
        : false,
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post("/complete-account-link", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const onboardingStatus = await checkAccountOnboardingStatus(
      user.stripeConnectedAccountId
    );

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        "hasCompleted.bankAccount": onboardingStatus.transfersEnabled,
        ...(onboardingStatus.transfersEnabled && user.accountType === "sender"
          ? { accountType: "both" }
          : {}),
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post("/invite-to-platform", checkJwt, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Emaill is required" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already has an account" });
    }
    await sendEmailWithTemplateKey(
      email,
      "inviteToPlatform",
      {},
      {
        inviter_name: `${req.user.firstName} ${req.user.lastName}`,
      }
    );
    res.status(200).json({ message: "Invitation email sent successfully" });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post("/notify-missing-bank-account", checkJwt, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await sendEmailWithTemplateKey(
      email,
      "setupBankAccount",
      {},
      {
        first_name: user.firstName,
        inviter_name: `${req.user.firstName} ${req.user.lastName}`,
      }
    );
    res.status(200).json({ message: "Reminder email sent successfully" });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

export default router;
