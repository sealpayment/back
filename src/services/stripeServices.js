import Stripe from "stripe";

const stripe = new Stripe(
  "sk_test_51Jp7SJCvCiK1jJUqrLwf4VqfGlf1fXulG7DNjaKRuWqrZfeMLjyCltPLJHcFCwcgWY4yowapIY5UUdqBZPHDbQ6d00PJGnDozg"
);

export async function createStripePaymentLink(mission) {
  try {
    const product = await stripe.products.create({
      name: mission.name,
      description: mission.description,
      default_price_data: {
        currency: "eur",
        unit_amount: mission.amount * 100,
      },
    });
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: product.default_price,
          quantity: 1,
        },
      ],
      metadata: {
        missionId: mission.id,
      },
    });
    return paymentLink;
  } catch (error) {
    console.error("Error creating payment link", error);
    throw error;
  }
}
