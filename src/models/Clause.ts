import mongoose, { model, models, Schema } from "mongoose";

const ClauseSchema = new Schema(
  {
    contractId: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
    },
    clauseType: {
      type: String,
      required: true,
    },
    found: {
      type: Boolean,
      default: false,
    },
    text: {
      type: String,
      default: "",
    },
    summary: {
      type: String,
      default: "",
    },
    confidence: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const Clause = models.Clause || model("Clause", ClauseSchema);

export default Clause;
