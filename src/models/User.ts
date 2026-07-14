import mongoose, { Schema, Model } from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  password: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: /^[6-9]\d{9}$/,
    },
    password: { type: String, required: true, minlength: 6 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
