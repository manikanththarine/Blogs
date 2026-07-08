import mongoose, { Schema, Document } from "mongoose";
import { BlogCategory } from "../src/types";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: "user" | "admin";
  preferences: {
    categories: BlogCategory[];
    theme: "light" | "dark";
    region: string;
  };
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  preferences: {
    categories: [{ type: String, enum: ["news", "lyrics", "sports", "tech"] }],
    theme: { type: String, enum: ["light", "dark"], default: "dark" },
    region: { type: String, default: "Global" }
  },
  createdAt: { type: Date, default: Date.now }
});

export default (mongoose.models.User as mongoose.Model<IUser>) || mongoose.model<IUser>("User", UserSchema);
