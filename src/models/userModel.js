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
  connected_account_id: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model("User", UserSchema);
