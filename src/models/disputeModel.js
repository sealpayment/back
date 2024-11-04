import e from "express";
import mongoose from "mongoose";
const { Schema } = mongoose;

const DisputeSchema = new Schema({
  missionId: { type: String, required: true },
  from_user_sub: { type: String },
  to_user_sub: { type: String },
  status: {
    type: String,
    enum: ["open", "closed"],
    default: "open",
  },
  endDate: {
    type: Date,
    default: () => new Date(Date.now() + 12 * 60 * 60 * 1000),
  },
  messages: [
    {
      from_user_sub: { type: String },
      message: { type: String },
      file: { type: String },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

const Dispute = mongoose.model("Dispute", DisputeSchema);

export default Dispute;
