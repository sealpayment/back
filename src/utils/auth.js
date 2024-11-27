import axios from "axios";
import { getTokenPayload } from "./helpers.js";
import { User } from "../models/userModel.js";

export const checkJwt = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("Authorization header manquant");
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send("Token manquant");
  }
  console.log("Token:", token);
  const payload = getTokenPayload(token);
  const user = await User.findById(payload.user_id).exec();
  req.user = user;
  next();
};
