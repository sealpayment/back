import mongoose from "mongoose";
const { Schema } = mongoose;

const MissionSchema = new Schema({
  from_user_sub: { type: String },
  to_user_sub: { type: String },
  recipient: {
    type: String,
    required: true,
  },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  endDate: { type: Date },
  paymentLink: { type: String },
  paymentIntentId: { type: String },
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
    ],
    default: "draft",
  },
  createdAt: { type: Date, default: Date.now },
});

const Mission = mongoose.model("Mission", MissionSchema);

export default Mission;
