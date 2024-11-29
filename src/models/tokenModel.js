import mongoose from "mongoose";
const { Schema } = mongoose;

const TokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Token = mongoose.model("Token", TokenSchema);
