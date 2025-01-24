import Stripe from "stripe";
import fs from "fs";

import { User } from "../models/userModel.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const WEBSITE_URL = process.env.WEBSITE_URL;

export async function createStripePaymentLink(mission, toUser) {
  try {
    const fromUser = await User.findById(mission.fromUserSub);
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
          destination: toUser?.stripeConnectedAccountId,
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

export async function createAccountLink(stripeConnectedAccountId, userId) {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: stripeConnectedAccountId,
      refresh_url: `${WEBSITE_URL}/onboarding/stripe/incomplete`,
      return_url: `${WEBSITE_URL}/onboarding/stripe/complete?userId=${userId}`,
      type: "account_onboarding",
    });

    return accountLink.url;
  } catch (error) {
    console.log(error);
    throw new Error("Error creating account link: " + error.message);
  }
}

export async function createConnectedAccount(userData) {
  try {
    const connectedAccount = await stripe.accounts.create({
      type: "express",
      email: userData.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      country: userData.country,
    });
    return {
      stripeConnectedAccountId: connectedAccount.id,
    };
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
}

export async function createConnectedAccountWithOnboarding(userData, userId) {
  try {
    const { stripeConnectedAccountId } = await createConnectedAccount(userData);
    const onboardingUrl = await createAccountLink(
      stripeConnectedAccountId,
      userId
    );
    return {
      stripeConnectedAccountId,
      onboardingUrl,
    };
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

export async function updateConnectedAccount(stripeConnectedAccountId, token) {
  try {
    return await stripe.accounts.update(stripeConnectedAccountId, {
      account_token: token,
    });
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function linkAccountToConnectedAccount(
  bankAccountId,
  stripeConnectedAccountId
) {
  try {
    await stripe.accounts.createExternalAccount(stripeConnectedAccountId, {
      external_account: bankAccountId,
    });
  } catch (error) {
    throw new Error(
      "Erreur lors de l'association du compte bancaire au compte connecté : " +
        error.message
    );
  }
}

export async function getConnectedBanks(stripeConnectedAccountId) {
  try {
    const banks = await stripe.accounts.listExternalAccounts(
      stripeConnectedAccountId,
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

export async function payoutToConnectedBankAccount(
  stripeConnectedAccountId,
  amount
) {
  try {
    const payout = await stripe.payouts.create(
      {
        amount: amount,
        currency: "eur",
      },
      {
        stripeAccount: stripeConnectedAccountId,
      }
    );
    return payout;
  } catch (error) {
    throw new Error(
      "Erreur lors de l'envoi des fonds au compte bancaire : " + error.message
    );
  }
}

export async function getConnectedAccountBalance(stripeConnectedAccountId) {
  try {
    const balance = await stripe.balance.retrieve({
      stripeAccount: stripeConnectedAccountId,
    });

    const payouts = await stripe.payouts.list(
      {
        limit: 100,
      },
      {
        stripeAccount: stripeConnectedAccountId,
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

export function calculateStripeFees(
  amount,
  isEuropeanCard = true,
  isBritishCard = false
) {
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
    const paymentMethod = await stripe.paymentMethods.retrieve(
      paymentIntent.payment_method
    );
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
      "SE", // Sweden
    ]);

    const isEuropeanCard = Boolean(
      paymentMethod?.card?.country &&
        EU_COUNTRIES.has(paymentMethod.card.country)
    );
    const stripeFees = calculateStripeFees(
      amount,
      isEuropeanCard,
      isBritishCard
    );
    const targetTotalFeePercentage = 0.05;
    const targetTotalFees = amount * targetTotalFeePercentage;
    let applicationFee = Math.max(0, targetTotalFees - stripeFees);
    applicationFee = Math.round(applicationFee * 100);
    await stripe.paymentIntents.capture(paymentIntentId, {
      application_fee_amount: applicationFee,
    });
    // await stripe.paymentIntents.capture(paymentIntentId);
  } catch (error) {
    console.error(error);
    throw new Error("Error while capturing payment intent" + error.message);
  }
}

export async function updateConnectedAccountEmail(
  stripeConnectedAccountId,
  email
) {
  try {
    return await stripe.accounts.update(stripeConnectedAccountId, {
      email: email,
    });
  } catch (error) {
    throw new Error("Error updating Stripe account email: " + error.message);
  }
}

export async function createStripeCustomer(userData) {
  try {
    const customerData = {
      email: userData.email,
      ...(userData.firstName && {
        name: `${userData.firstName} ${userData.lastName || ""}`.trim(),
      }),
    };
    const customer = await stripe.customers.create(customerData);
    return customer;
  } catch (error) {
    console.log(error);
    throw new Error("Error creating Stripe customer: " + error.message);
  }
}

export async function deleteConnectedAccount(stripeConnectedAccountId) {
  try {
    if (!stripeConnectedAccountId) {
      return;
    }
    return await stripe.accounts.del(stripeConnectedAccountId);
  } catch (error) {
    console.error("Error deleting Stripe Connected Account:", error);
    throw new Error(
      "Error deleting Stripe Connected Account: " + error.message
    );
  }
}

export async function cancelPaymentIntent(paymentIntentId) {
  try {
    if (!paymentIntentId) {
      return;
    }
    await stripe.paymentIntents.cancel(paymentIntentId);
  } catch (error) {
    console.error("Error canceling payment intent:", error);
    throw new Error("Error canceling payment intent: " + error.message);
  }
}

export async function checkAccountOnboardingStatus(stripeConnectedAccountId) {
  try {
    if (!stripeConnectedAccountId) {
      throw new Error("Stripe Connected Account ID is required");
    }

    const account = await stripe.accounts.retrieve(stripeConnectedAccountId);

    return {
      isComplete: account.details_submitted,
      transfersEnabled: account.capabilities?.transfers === "active",
    };
  } catch (error) {
    console.error("Error checking account onboarding status:", error);
    throw new Error(
      "Error checking account onboarding status: " + error.message
    );
  }
}
