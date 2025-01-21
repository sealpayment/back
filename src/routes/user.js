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
} from "../services/stripeServices.js";
import { multerUpload } from "../middlewares/middleware.js";
import { sendEmailWithTemplateKey } from "../services/emailServices.js";

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
        user.connected_account_id,
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
    res.status(200).json({ exists: !!emailExists });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

export default router;
