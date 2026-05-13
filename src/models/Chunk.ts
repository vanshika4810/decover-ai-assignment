import mongoose, { Schema, models, model } from "mongoose";

const ChunkSchema = new Schema(
  {
    contractId: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
    },

    text: {
      type: String,
      required: true,
    },

    chunkIndex: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Chunk = models.Chunk || model("Chunk", ChunkSchema);

export default Chunk;
