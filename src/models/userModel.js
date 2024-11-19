import mongoose from "mongoose";
const { Schema } = mongoose;

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  sub: { type: String, required: true, unique: true },
  connected_account_id: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model("User", UserSchema);
