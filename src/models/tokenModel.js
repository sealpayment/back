import mongoose from "mongoose";
const { Schema } = mongoose;

const TokenSchema = new Schema({
  type: {
    type: String,
    enum: ["reset-password"],
  },
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Token = mongoose.model("Token", TokenSchema);
