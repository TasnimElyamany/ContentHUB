import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  _id: mongoose.Types.ObjectId;
  documentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  position: {
    start: number;
    end: number;
  };
  parentCommentId?: mongoose.Types.ObjectId;
  resolved: boolean;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    position: {
      start: { type: Number, required: true },
      end: { type: Number, required: true },
    },
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

CommentSchema.index({ documentId: 1 });
CommentSchema.index({ parentCommentId: 1 });
CommentSchema.index({ userId: 1 });

export const Comment = mongoose.model<IComment>('Comment', CommentSchema);
