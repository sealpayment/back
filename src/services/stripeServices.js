import Stripe from "stripe";
import fs from "fs";

import { User } from "../models/userModel.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const WEBSITE_URL = process.env.WEBSITE_URL;

export async function createStripePaymentLink(mission, toUser) {
  try {
    const fromUser = await User.findById(mission.from_user_sub);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      payment_method_options: {
        card: {
          request_three_d_secure: "any",
        },
      },
      customer_email: fromUser?.email,
      line_items: [
        {
          price_data: {
            currency: mission.currency,
            product_data: {
              name: "Ces conditions engage le prestataire à réaliser les obligations suivantes :",
              description: mission.description,
            },
            unit_amount: mission.amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${WEBSITE_URL}/mission`,
      cancel_url: `${WEBSITE_URL}/mission`,
      metadata: { missionId: mission.id },
      payment_intent_data: {
        capture_method: "manual",
        transfer_data: {
          destination: toUser?.connected_account_id,
        },
      },
    });
    return session.url;
  } catch (error) {
    console.log(error);
    throw new Error(
      "Erreur lors de la création du lien de paiement : " + error.message
    );
  }
}

export async function createConnectedAccount(userData) {
  try {
    if (!userData.accountToken) {
      throw new Error("Token de compte manquant");
    }
    const connectedAccount = await stripe.accounts.create({
      account_token: userData.accountToken,
      type: "custom",
      country: userData.country,
      email: userData.email,
      business_profile: {
        mcc: "7999",
        product_description: "Prestation de services",
      },
      requested_capabilities: ["card_payments", "transfers"],
    });
    return connectedAccount;
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
}

export async function uploadIdentityDocument(file) {
  const fileStream = fs.createReadStream(file.path);
  const stripeFile = await stripe.files.create({
    purpose: "identity_document",
    file: {
      data: fileStream,
      name: file.filename,
      type: file.mimetype,
    },
  });
  fs.unlinkSync(file.path);
  return stripeFile.id;
}

export async function updateConnectedAccount(connectedAccountId, token) {
  try {
    return await stripe.accounts.update(connectedAccountId, {
      account_token: token,
    });
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function linkAccountToConnectedAccount(
  bankAccountId,
  connectedAccountId
) {
  try {
    await stripe.accounts.createExternalAccount(connectedAccountId, {
      external_account: bankAccountId,
    });
  } catch (error) {
    throw new Error(
      "Erreur lors de l'association du compte bancaire au compte connecté : " +
        error.message
    );
  }
}

export async function getConnectedBanks(connectedAccountId) {
  try {
    const banks = await stripe.accounts.listExternalAccounts(
      connectedAccountId,
      {
        object: "bank_account",
      }
    );
    return banks.data;
  } catch (error) {
    throw new Error(
      "Erreur lors de la récupération des comptes bancaires : " + error.message
    );
  }
}

export async function refundToCustomer(paymentIntentId) {
  try {
    await stripe.paymentIntents.cancel(paymentIntentId);
  } catch (error) {
    console.error(error);
    throw new Error(
      "Erreur lors de l'annulation du transfert : " + error.message
    );
  }
}

export async function payoutToConnectedBankAccount(connectedAccountId, amount) {
  try {
    const payout = await stripe.payouts.create(
      {
        amount: amount,
        currency: "eur",
      },
      {
        stripeAccount: connectedAccountId,
      }
    );
    return payout;
  } catch (error) {
    throw new Error(
      "Erreur lors de l'envoi des fonds au compte bancaire : " + error.message
    );
  }
}

export async function getConnectedAccountBalance(connectedAccountId) {
  try {
    const balance = await stripe.balance.retrieve({
      stripeAccount: connectedAccountId,
    });

    const payouts = await stripe.payouts.list(
      {
        limit: 100,
      },
      {
        stripeAccount: connectedAccountId,
      }
    );

    return {
      payouts: payouts.data,
      available: balance.available.reduce((total, available) => {
        return total + available.amount / 100;
      }, 0),
      pending: balance.pending.reduce((total, pending) => {
        return total + pending.amount / 100;
      }, 0),
    };
  } catch (error) {
    throw new Error(
      "Erreur lors de la récupération de la balance et des payouts : " +
        error.message
    );
  }
}

export function calculateStripeFees(amount, isEuropeanCard = true, isBritishCard = false) {
  let percentageFee;
  if (isBritishCard) {
    percentageFee = 0.025; // 2.5% for British cards
  } else {
    percentageFee = isEuropeanCard ? 0.015 : 0.0325; // 1.5% for EU, 3.25% for non-EU
  }
  const fixedFee = 0.25;
  return amount * percentageFee + fixedFee;
}

export async function capturePaymentIntent(paymentIntentId) {
  try {
    if (!paymentIntentId) {
      return;
    }
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status === "succeeded") {
      console.log("Payment intent already captured");
      return;
    }
    const amount = paymentIntent.amount / 100;
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method);
    const isBritishCard = paymentMethod?.card?.country === "GB";
    const EU_COUNTRIES = new Set([
      "AT", // Austria
      "BE", // Belgium
      "BG", // Bulgaria
      "DE", // Germany
      "ES", // Spain
      "FR", // France
      "IT", // Italy
      "NL", // Netherlands
      "PL", // Poland
      "PT", // Portugal
      "RO", // Romania
      "SE"  // Sweden
    ]);

    const isEuropeanCard = Boolean(paymentMethod?.card?.country && EU_COUNTRIES.has(paymentMethod.card.country));
    const stripeFees = calculateStripeFees(amount, isEuropeanCard, isBritishCard);
    const targetTotalFeePercentage = 0.05;
    const targetTotalFees = amount * targetTotalFeePercentage;
    let applicationFee = Math.max(0, targetTotalFees - stripeFees);
    applicationFee = Math.round(applicationFee * 100);
    await stripe.paymentIntents.capture(paymentIntentId, {
      application_fee_amount: applicationFee
    });
    // await stripe.paymentIntents.capture(paymentIntentId);
  } catch (error) {
    console.error(error);
    throw new Error("Error while capturing payment intent" + error.message);
  }
}

export async function updateConnectedAccountEmail(connectedAccountId, email) {
  try {
    return await stripe.accounts.update(connectedAccountId, {
      email: email
    });
  } catch (error) {
    throw new Error("Error updating Stripe account email: " + error.message);
  }
}
