import mongoose, { Schema, Document } from 'mongoose';

export interface IAIUsage extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  documentId: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  action: 'generate' | 'improve' | 'grammar' | 'shorten' | 'expand' | 'tone';
  provider: string;
  tokensUsed: number;
  prompt: string;
  response: string;
  createdAt: Date;
}

const AIUsageSchema = new Schema<IAIUsage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    action: {
      type: String,
      enum: ['generate', 'improve', 'grammar', 'shorten', 'expand', 'tone'],
      required: true,
    },
    provider: {
      type: String,
      required: true,
    },
    tokensUsed: {
      type: Number,
      required: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    response: {
      type: String,
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AIUsageSchema.index({ userId: 1, createdAt: -1 });
AIUsageSchema.index({ workspaceId: 1, createdAt: -1 });
AIUsageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90 days

export const AIUsage = mongoose.model<IAIUsage>('AIUsage', AIUsageSchema);
