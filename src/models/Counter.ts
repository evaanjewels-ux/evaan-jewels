import mongoose, { Schema, Model } from "mongoose";
import { ICounter } from "@/types";

const CounterSchema = new Schema<ICounter>({
  name: { type: String, required: true },
  prefix: { type: String, required: true },
  year: { type: Number, required: true },
  seq: { type: Number, default: 0 },
});

CounterSchema.index({ name: 1, year: 1 }, { unique: true });

const Counter: Model<ICounter> =
  mongoose.models.Counter ||
  mongoose.model<ICounter>("Counter", CounterSchema);

/**
 * Get the next sequence number for a counter
 */
export async function getNextSequence(
  name: string,
  prefix: string,
  year: number
): Promise<number> {
  const counter = await Counter.findOneAndUpdate(
    { name, year },
    { $inc: { seq: 1 }, $setOnInsert: { prefix } },
    { upsert: true, returnDocument: "after" }
  );
  return counter.seq;
}

export default Counter;
