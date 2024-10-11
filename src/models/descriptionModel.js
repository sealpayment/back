import mongoose from "mongoose";

const { Schema } = mongoose;

const DescriptionSchema = new Schema({
  user_id: { type: String },
  description: { type: String },
  locale: { type: String },
  image: { type: String },
  exif: { type: Object },
  usage: {
    prompt_tokens: Number,
    completion_tokens: Number,
    total_tokens: Number,
  },
  questions: {
    type: Array,
    default: [],
  },
  createdAt: { type: Date, default: Date.now },
});

export const Description = mongoose.model("Description", DescriptionSchema);
