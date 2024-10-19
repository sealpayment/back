import Stripe from "stripe";

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
            product_data: {
              name: mission.name,
            },
            unit_amount: mission.amount * 100, // Montant en centimes
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `http://localhost:3000/mission/success?mission_id=${mission.id}`,
      cancel_url: "http://localhost:3000/mission",
      metadata: {
        missionId: mission.id,
      },
    });
    return session.url;
  } catch (error) {
    throw error;
  }
}
