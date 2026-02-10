import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  name: string;
  avatar?: string;
  aiCredits: {
    total: number;
    used: number;
    resetDate: Date;
  };
  preferences: {
    theme: 'light' | 'dark';
    editorFont: string;
    defaultTone: string;
  };
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  lastLogin: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
    },
    aiCredits: {
      total: { type: Number, default: 1000 },
      used: { type: Number, default: 0 },
      resetDate: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    },
    preferences: {
      theme: { type: String, enum: ['light', 'dark'], default: 'light' },
      editorFont: { type: String, default: 'Arial' },
      defaultTone: { type: String, default: 'professional' },
    },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    lastLogin: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

UserSchema.index({ passwordResetToken: 1 }, { sparse: true });

export const User = mongoose.model<IUser>('User', UserSchema);
