import express from "express";

import { checkJwt, updateUser, getUser } from "../utils/auth.js";
import { User } from "../models/userModel.js";
import { updateConnectedAccount } from "../services/stripeServices.js";

const router = express.Router();

router.get("/me", checkJwt, async ({ user }, res) => {
  try {
    const userFound = await getUser(user.sub);
    res.status(200).json(userFound);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.put("/me", checkJwt, async ({ user, body }, res) => {
  try {
    const userFound = await User.findOne({ sub: user.sub }).exec();
    const updatedUser = await updateUser(user.sub, body);
    const dateToDob = new Date(body.dob);
    await updateConnectedAccount(userFound.connected_account_id, {
      email: body.email,
      first_name: body.firstName,
      last_name: body.lastName,
      address: {
        line1: body.address,
        city: body.city,
        country: body.country,
        postal_code: body.postal,
      },
      phone: body.phone,
      dob: {
        day: dateToDob.getDate(),
        month: dateToDob.getMonth() + 1,
        year: dateToDob.getFullYear(),
      },
      mcc: "7999",
      product_description: "Prestation de services",
    });
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

export default router;
