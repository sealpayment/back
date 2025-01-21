import dayjs from "dayjs";
import mongoose from "mongoose";
const { Schema } = mongoose;

const MissionSchema = new Schema({
  type: { type: String, enum: ["ask", "send"] },
  from_user_sub: { type: String },
  to_user_sub: { type: String },
  recipientHasAccount: { type: Boolean, default: false },
  recipient: {
    type: String,
    required: true,
  },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  endDate: { type: Date },
  paymentLink: { type: String },
  paymentIntentId: { type: String },
  currency: { type: String, enum: ["eur", "usd", "gbp"], default: "eur" },
  dispute: {
    messages: [
      {
        from_user_sub: { type: String },
        message: { type: String },
        file: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ["open", "closed", "completed"],
      default: "closed",
    },
  },
  status: {
    type: String,
    enum: [
      "draft",
      "active",
      "cancelled",
      "completed",
      "paid",
      "error",
      "refund",
      "disputed"
    ],
    default: "draft",
  },
  statusMessage: { type: String },
  reminderSent: { type: Boolean, default: false },
  createdAt: { type: Date, default: dayjs().second(0).millisecond(0) },
});

const Mission = mongoose.model("Mission", MissionSchema);

export default Mission;
