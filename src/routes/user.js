import express from "express";

import { User } from "../models/userModel.js";
import authMiddleware from "../utils/auth.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/me", async (req, res) => {
  const user = req.user;
  if (user) {
    return res.status(200).json(user);
  }
  res.status(400).json({ message: "User not found" });
});

router.put("/me", async (req, res) => {
  let user = req.user;
  console.log("user", user);
  if (user) {
    const updatedUser = await User.findByIdAndUpdate(user._id, req.body, {
      new: true,
    });
    return res.status(200).json(updatedUser);
  }
  res.status(400).json({ message: "User not found" });
});

export default router;
