import mongoose, { Schema, Document as MongoDocument } from 'mongoose';

export interface ICollaborator {
  userId: mongoose.Types.ObjectId;
  role: 'editor' | 'viewer';
}

export interface IDocument extends MongoDocument {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  owner: mongoose.Types.ObjectId;
  workspace?: mongoose.Types.ObjectId;
  collaborators: ICollaborator[];
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  aiUsage: {
    generateCalls: number;
    improveCalls: number;
    totalTokens: number;
  };
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      default: '',
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: false,
      default: null,
    },
    collaborators: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['editor', 'viewer'],
        },
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    aiUsage: {
      generateCalls: { type: Number, default: 0 },
      improveCalls: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

DocumentSchema.index({ workspace: 1 });
DocumentSchema.index({ owner: 1 });
DocumentSchema.index({ status: 1 });
DocumentSchema.index({ tags: 1 });
DocumentSchema.index({ title: 'text', content: 'text' });

export const ContentDocument = mongoose.model<IDocument>('Document', DocumentSchema);
