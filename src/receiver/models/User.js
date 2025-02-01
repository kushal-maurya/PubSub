import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true },
  user: { type: String, required: true },
  class: { type: String, required: true },
  age: { type: Number, required: true },
  email: { type: String, required: true },
  inserted_at: { type: Date, required: true },
});

export default mongoose.model("User", UserSchema);
