import mongoose from "mongoose";
import crypto from "crypto";
import { generateRandom } from "../utils/helpers.js";

const { Schema } = mongoose;

const UserSchema = new Schema({
  email: { type: String },
  password: { type: String },
  availablePhotos: { type: Number, min: 0, default: 3 },
  language: { type: String, default: "en" },
  tutorial: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  admin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model("User", UserSchema);
