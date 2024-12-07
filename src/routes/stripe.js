import express from "express";

import { checkJwt } from "../utils/auth.js";
import { User } from "../models/userModel.js";

import {
  linkAccountToConnectedAccount,
  getConnectedBanks,
  payoutToConnectedBankAccount,
  getConnectedAccountBalance,
} from "../services/stripeServices.js";

const router = express.Router();

router.post("/add-bank-account", checkJwt, async ({ user, body }, res) => {
  try {
    await linkAccountToConnectedAccount(body.token, user.connected_account_id);
    user.hasCompleted.bankAccount = true;
    await user.save();
    res.json({
      message: "Account linked successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
});

router.get("/bank-accounts", checkJwt, async ({ user }, res) => {
  try {
    const bankAccounts = await getConnectedBanks(user.connected_account_id);
    res.json(bankAccounts);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des comptes bancaires",
      error: error.message,
    });
  }
});

router.post("/payout", checkJwt, async ({ user, body }, res) => {
  try {
    const { amount } = body;
    const payout = await payoutToConnectedBankAccount(
      user.connected_account_id,
      amount * 100
    );
    res.json(payout);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la création du transfert",
      error: error.message,
    });
  }
});

router.get("/balance", checkJwt, async ({ user }, res) => {
  try {
    const balance = await getConnectedAccountBalance(user.connected_account_id);
    res.json(balance);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération du solde",
      error: error.message,
    });
  }
});

export default router;
