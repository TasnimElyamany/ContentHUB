import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkspaceMember {
  userId: mongoose.Types.ObjectId;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joinedAt: Date;
}

export interface IWorkspaceSettings {
  aiCreditsShared: boolean;
  allowPublicSharing: boolean;
  defaultDocumentStatus: 'draft' | 'published';
  allowGuestComments: boolean;
  requireApproval: boolean;
}

export interface IWorkspace extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  icon?: string;
  description?: string;
  owner: mongoose.Types.ObjectId;
  members: IWorkspaceMember[];
  settings: IWorkspaceSettings;
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspace>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
    },
    description: {
      type: String,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['owner', 'admin', 'editor', 'viewer'],
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    settings: {
      aiCreditsShared: { type: Boolean, default: true },
      allowPublicSharing: { type: Boolean, default: false },
      defaultDocumentStatus: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft',
      },
      allowGuestComments: { type: Boolean, default: false },
      requireApproval: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

WorkspaceSchema.index({ owner: 1 });
WorkspaceSchema.index({ 'members.userId': 1 });

export const Workspace = mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);
