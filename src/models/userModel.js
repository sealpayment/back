import mongoose from "mongoose";
const { Schema } = mongoose;

const UserSchema = new Schema({
  email: { type: String },
  emailVerified: { type: Boolean, default: false },
  password: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  country: { type: String },
  postal: { type: String },
  dob: { type: String },
  stripeConnectedAccountId: { type: String },
  stripeCustomerId: { type: String },
  hasCompleted: {
    bankAccount: { type: Boolean, default: false },
    identity: { type: Boolean, default: false },
  },
  isRegistered: { type: Boolean, default: false },
  accountType: {
    type: String,
    enum: ["sender", "receiver", "both"],
    default: "sender",
  },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model("User", UserSchema);
