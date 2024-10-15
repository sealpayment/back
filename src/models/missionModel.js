import mongoose from "mongoose";
const { Schema } = mongoose;

const RequirementSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
});

const MissionSchema = new Schema({
  from_user_sub: { type: String, required: true },
  to_user_sub: { type: String },
  recipient: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: (props) => `${props.value} is not a valid email address`,
    },
  },
  amount: { type: Number, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  paymentLink: { type: String },
  status: {
    type: String,
    enum: ["draft", "pending", "active", "declined"],
    default: "draft",
  },
  requirements: [RequirementSchema],
  createdAt: { type: Date, default: Date.now },
});

const Mission = mongoose.model("Mission", MissionSchema);

export default Mission;
