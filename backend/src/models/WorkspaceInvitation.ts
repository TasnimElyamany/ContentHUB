import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkspaceInvitation extends Document {
  _id: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  invitedBy: mongoose.Types.ObjectId;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

const WorkspaceInvitationSchema = new Schema<IWorkspaceInvitation>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'editor', 'viewer'],
      required: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired'],
      default: 'pending',
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);


WorkspaceInvitationSchema.index({ token: 1 });
WorkspaceInvitationSchema.index({ email: 1, workspaceId: 1 });
WorkspaceInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const WorkspaceInvitation = mongoose.model<IWorkspaceInvitation>(
  'WorkspaceInvitation',
  WorkspaceInvitationSchema
);
