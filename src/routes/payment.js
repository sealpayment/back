import express from "express";

import { checkJwt } from "../utils/auth.js";
import {
  getOrCreateCustomer,
  getPaymentMethods,
  addPaymentMethod,
} from "../services/stripeServices.js";

const router = express.Router();

router.get("/payment-method", checkJwt, async ({ user }, res) => {
  try {
    const customer = await getOrCreateCustomer(user.sub);
    const paymentMethods = await getPaymentMethods(customer.id);
    res.json(paymentMethods);
  } catch (error) {
    res.status(500).json({
      message:
        "Une erreur est survenue lors de la récupération des comptes bancaires",
      error: error.message,
    });
  }
});

router.post("/payment-method", checkJwt, async ({ user, body }, res) => {
  try {
    const customer = await getOrCreateCustomer(user.sub);
    const paymentMethod = await addPaymentMethod(
      customer.id,
      body.paymentMethodId
    );

    console.log("Payment method added successfully", paymentMethod);
    res.json({
      message: "Payment method added successfully",
      paymentMethod: paymentMethod.id,
    });
  } catch (error) {
    res.status(500).json({
      message: "Une erreur est survenue lors de l'ajout du compte bancaire",
      error: error.message,
    });
  }
});

export default router;
