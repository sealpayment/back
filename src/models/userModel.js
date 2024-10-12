import mongoose from "mongoose";
import crypto from "crypto";
import { generateRandom } from "../utils/helpers.js";

const { Schema } = mongoose;

const UserSchema = new Schema({
  email: { type: String },
  password: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model("User", UserSchema);
