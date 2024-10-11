
import mongoose from "mongoose";

const { Schema } = mongoose;

const ConfigSchema = new Schema({
  promptDescription: { type: String },
  keywords: { type: Array },
});

export const Configuration = mongoose.model("Configuration", ConfigSchema);
