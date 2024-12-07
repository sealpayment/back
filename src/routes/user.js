import express from "express";

import { checkJwt } from "../utils/auth.js";
import { User } from "../models/userModel.js";
import {
  updateConnectedAccount,
  uploadIdentityDocument,
} from "../services/stripeServices.js";
import { multerUpload } from "../middlewares/middleware.js";

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

export default router;
