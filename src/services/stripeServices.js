import Stripe from "stripe";
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

export async function getOrCreateCustomer(userId) {
  try {
    const customers = await stripe.customers.search({
      query: `metadata['custom_id']:'${userId}'`,
    });

    if (customers.data.length > 0) {
      return customers.data[0];
    } else {
      const newCustomer = await stripe.customers.create({
        metadata: { custom_id: userId },
      });
      return newCustomer;
    }
  } catch (error) {
    throw new Error(
      "Erreur lors de la récupération ou création du client : " + error.message
    );
  }
}

export async function getPaymentMethods(customerId) {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });
    return paymentMethods.data;
  } catch (error) {
    throw new Error(
      "Erreur lors de la récupération des moyens de paiement : " + error.message
    );
  }
}

export async function addPaymentMethod(customerId, paymentMethodId) {
  try {
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
    return paymentMethod;
  } catch (error) {
    throw new Error(
      "Erreur lors de l'ajout du moyen de paiement : " + error.message
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

export async function updateConnectedAccount(connectedAccountId, userData) {
  try {
    const accountToken = await stripe.tokens.create({
      account: {
        individual: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          address: {
            line1: userData.address.line1,
            city: userData.address.city,
            country: userData.address.country,
            postal_code: userData.address.postal_code,
          },
          dob: {
            day: userData.dob.day,
            month: userData.dob.month,
            year: userData.dob.year,
          },
          phone: userData.phone,
        },
        business_type: "individual",
        tos_shown_and_accepted: true,
      },
    });
    await stripe.accounts.update(connectedAccountId, {
      account_token: accountToken.id,
      business_profile: {
        mcc: userData.mcc, // Code de catégorie marchande
        product_description: userData.product_description,
      },
      external_account: userData.bank_account, // Détails du compte bancaire
    });
  } catch (error) {
    throw new Error(
      "Erreur lors de la mise à jour du compte connecté : " + error.message
    );
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

export async function createBankAccount(iban, accountHolderName) {
  try {
    const token = await stripe.tokens.create({
      bank_account: {
        country: "FR",
        currency: "eur",
        account_holder_name: accountHolderName,
        account_number: iban,
        account_holder_type: "individual",
      },
    });
    return token.id;
  } catch (error) {
    throw new Error(
      "Erreur lors de la création du compte bancaire : " + error.message
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

export async function transferToConnectedAccount(connectedAccountId, amount) {
  try {
    const account = await stripe.accounts.retrieve(connectedAccountId);
    // if (account.requirements.currently_due.length > 0) {
    //   return;
    // }
    const transfer = await stripe.transfers.create({
      amount: amount,
      currency: "eur",
      destination: connectedAccountId,
    });
    return transfer;
  } catch (error) {
    throw new Error("Erreur lors du transfert des fonds : " + error.message);
  }
}

export async function transferFromConnectedAccount(connectedAccountId, amount) {
  try {
    const account = await stripe.accounts.retrieve();

    const transfer = await stripe.transfers.create(
      {
        amount: amount,
        currency: "eur",
        destination: account.id,
        source_type: "card",
      },
      {
        stripeAccount: connectedAccountId, // L'ID du compte connecté
      }
    );

    return transfer;
  } catch (error) {
    throw new Error(
      "Erreur lors du transfert des fonds depuis le compte connecté : " +
        error.message
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
    await stripe.paymentIntents.capture(paymentIntentId);
  } catch (error) {
    console.error(error);
    throw new Error("Error while capturing payment intent" + error.message);
  }
}
