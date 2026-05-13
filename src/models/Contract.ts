import mongoose, { Schema, models, model } from "mongoose";

const ContractSchema = new Schema(
  {
    fileName: {
      type: String,
      required: true,
    },

    rawText: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["uploaded", "processing", "completed"],
      default: "uploaded",
    },
  },
  {
    timestamps: true,
  },
);

const Contract = models.Contract || model("Contract", ContractSchema);

export default Contract;
