import express from "express";

import { checkJwt } from "../utils/auth.js";
import { User } from "../models/userModel.js";

import {
  createBankAccount,
  linkAccountToConnectedAccount,
  getConnectedBanks,
  payoutToConnectedBankAccount,
  getConnectedAccountBalance,
} from "../services/stripeServices.js";

const router = express.Router();

router.post("/add-bank-account", checkJwt, async ({ user, body }, res) => {
  try {
    const userFound = await User.findOne({ sub: user.sub });
    const bankAccountId = await createBankAccount(
      body.iban,
      body.accountHolderName,
      userFound.connected_account_id
    );
    await linkAccountToConnectedAccount(
      bankAccountId,
      userFound.connected_account_id
    );
    res.json({
      account_id: bankAccountId,
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
    const userFound = await User.findOne({ sub: user.sub });
    const bankAccounts = await getConnectedBanks(
      userFound.connected_account_id
    );
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
    const userFound = await User.findOne({ sub: user.sub });
    const { amount } = body;
    const payout = await payoutToConnectedBankAccount(
      userFound.connected_account_id,
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
    const userFound = await User.findOne({ sub: user.sub });
    const balance = await getConnectedAccountBalance(
      userFound.connected_account_id
    );
    res.json(balance);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération du solde",
      error: error.message,
    });
  }
});

export default router;
