import express from "express";

import { checkJwt } from "../utils/auth.js";
import { User } from "../models/userModel.js";

import {
  linkAccountToConnectedAccount,
  getConnectedBanks,
  payoutToConnectedBankAccount,
  getConnectedAccountBalance,
  createAccountLink,
  getConnectedAccountDetails,
  createConnectedAccount,
} from "../services/stripeServices.js";

const router = express.Router();

router.post("/add-bank-account", checkJwt, async ({ user, body }, res) => {
  try {
    await linkAccountToConnectedAccount(
      body.token,
      user.stripeConnectedAccountId
    );
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
    const bankAccounts = await getConnectedBanks(user.stripeConnectedAccountId);
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
      user.stripeConnectedAccountId,
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
    const balance = await getConnectedAccountBalance(
      user.stripeConnectedAccountId
    );
    res.json(balance);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération du solde",
      error: error.message,
    });
  }
});

router.get("/account-link", checkJwt, async ({ user, query }, res) => {
  try {
    const { refreshPath, returnPath } = query;
    const accountLink = await createAccountLink(
      user.stripeConnectedAccountId,
      refreshPath,
      returnPath
    );
    res.json({ url: accountLink });
  } catch (error) {
    res.status(500).json({
      message: "Error creating account link",
      error: error.message,
    });
  }
});

router.get("/account-details", checkJwt, async ({ user }, res) => {
  try {
    const accountDetails = await getConnectedAccountDetails(
      user.stripeConnectedAccountId
    );
    res.json(accountDetails);
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving account details",
      error: error.message,
    });
  }
});

router.post("/create-account", checkJwt, async ({ user }, res) => {
  try {
    if (user.stripeConnectedAccountId) {
      return res.status(400).json({
        message: "User already has a Stripe Connected Account",
      });
    }
    const connectedAccount = await createConnectedAccount({
      email: user.email,
      country: user.country || "FR", // Default to France if not specified
    });

    user.stripeConnectedAccountId = connectedAccount.stripeConnectedAccountId;
    await user.save();

 
    res.json({
      message: "Account created successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error creating Stripe account",
      error: error.message,
    });
  }
});

export default router;
