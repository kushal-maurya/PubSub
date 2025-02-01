import mongoose from "mongoose";

const ProcessedUserSchema = new mongoose.Schema({
  id: String,
  user: String,
  class: String,
  age: Number,
  email: String,
  inserted_at: Date,
  modified_at: Date,
});

export default mongoose.model("ProcessedUser", ProcessedUserSchema);
