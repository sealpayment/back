import mongoose from "mongoose";

const { Schema } = mongoose;

const ReportSchema = new Schema({
  reason: String,
  refund: Boolean,
  descriptionId: String,
  isResolved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const Report = mongoose.model("Report", ReportSchema);
