import Stripe from "stripe";

// Initialisation de l'instance Stripe avec la clé secrète
const stripe = new Stripe(
  "sk_test_51Jp7SJCvCiK1jJUqrLwf4VqfGlf1fXulG7DNjaKRuWqrZfeMLjyCltPLJHcFCwcgWY4yowapIY5UUdqBZPHDbQ6d00PJGnDozg"
);

export async function createStripePaymentLink(mission) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: mission.name },
            unit_amount: mission.amount * 100, // Montant en centimes
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `http://localhost:3000/mission/success?mission_id=${mission.id}`,
      cancel_url: "http://localhost:3000/mission",
      metadata: { missionId: mission.id },
    });
    return session.url;
  } catch (error) {
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
    const accountToken = await stripe.tokens.create({
      account: {
        individual: userData,
        business_type: "individual",
        tos_shown_and_accepted: true,
      },
    });
    const connectedAccount = await stripe.accounts.create({
      account_token: accountToken.id,
      type: "custom",
      country: "FR",
      requested_capabilities: ["card_payments", "transfers"],
    });
    return connectedAccount;
  } catch (error) {
    throw new Error(
      "Erreur lors de la création du compte connecté : " + error.message
    );
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

export async function transferFundsToConnectedAccount(
  connectedAccountId,
  amount
) {
  try {
    const transfer = await stripe.transfers.create({
      amount: amount,
      currency: "eur",
      destination: connectedAccountId,
    });
    return transfer;
  } catch (error) {
    console.log("Erreur lors du transfert des fonds : " + error.message);
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
        status: "pending",
        limit: 100,
      },
      {
        stripeAccount: connectedAccountId,
      }
    );

    const totalPayoutsPending = payouts.data.reduce((total, payout) => {
      return total + payout.amount;
    }, 0);

    const availableBalance = balance.available.reduce((total, available) => {
      return total + available.amount;
    }, 0);

    const balanceAfterPayouts = availableBalance - totalPayoutsPending;

    return {
      availableBalance: availableBalance / 100, // Convertir en EUR
      totalPayoutsPending: totalPayoutsPending / 100, // Convertir en EUR
      balanceAfterPayouts: balanceAfterPayouts / 100, // Convertir en EUR
    };
  } catch (error) {
    throw new Error(
      "Erreur lors de la récupération de la balance et des payouts : " +
        error.message
    );
  }
}
