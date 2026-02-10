import mongoose from 'mongoose';
import { Comment, IComment, ContentDocument } from '../models';
import { ApiError } from '../utils/apiError';
import { CreateCommentInput, UpdateCommentInput } from '../schemas/comment.schema';

class CommentService {
  async getComments(documentId: string, userId: string): Promise<IComment[]> {
    const document = await ContentDocument.findById(documentId);
    if (!document) {
      throw ApiError.notFound('Document not found');
    }
    const comments = await Comment.aggregate([
      {
        $match: {
          documentId: new mongoose.Types.ObjectId(documentId),
          parentCommentId: null,
        },
      },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'parentCommentId',
          as: 'replies',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          'user.password': 0,
          'user.passwordResetToken': 0,
          'user.passwordResetExpires': 0,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    for (const comment of comments) {
      if (comment.replies && comment.replies.length > 0) {
        await Comment.populate(comment.replies, {
          path: 'userId',
          select: 'name email avatar',
        });
      }
    }

    return comments;
  }

  async createComment(
    documentId: string,
    userId: string,
    data: CreateCommentInput
  ): Promise<IComment> {
    const document = await ContentDocument.findById(documentId);
    if (!document) {
      throw ApiError.notFound('Document not found');
    }

    const comment = await Comment.create({
      documentId,
      userId,
      content: data.content,
      position: data.position,
      parentCommentId: data.parentCommentId || null,
    });

    return comment.populate('userId', 'name email avatar');
  }

  async updateComment(
    commentId: string,
    userId: string,
    data: UpdateCommentInput
  ): Promise<IComment> {
    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw ApiError.notFound('Comment not found');
    }

    if (comment.userId.toString() !== userId) {
      throw ApiError.forbidden('You can only edit your own comments');
    }

    comment.content = data.content;
    await comment.save();

    return comment.populate('userId', 'name email avatar');
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw ApiError.notFound('Comment not found');
    }

    const document = await ContentDocument.findById(comment.documentId);
    const isAuthor = comment.userId.toString() === userId;
    const isDocOwner = document?.owner.toString() === userId;

    if (!isAuthor && !isDocOwner) {
      throw ApiError.forbidden('You do not have permission to delete this comment');
    }
    await Comment.deleteMany({
      $or: [{ _id: commentId }, { parentCommentId: commentId }],
    });
  }

  async resolveComment(commentId: string, userId: string): Promise<IComment> {
    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw ApiError.notFound('Comment not found');
    }

    comment.resolved = true;
    comment.resolvedBy = new mongoose.Types.ObjectId(userId);
    comment.resolvedAt = new Date();

    await comment.save();
    return comment.populate('userId', 'name email avatar');
  }

  async replyToComment(
    parentCommentId: string,
    userId: string,
    content: string
  ): Promise<IComment> {
    const parentComment = await Comment.findById(parentCommentId);

    if (!parentComment) {
      throw ApiError.notFound('Parent comment not found');
    }

    const reply = await Comment.create({
      documentId: parentComment.documentId,
      userId,
      content,
      position: parentComment.position,
      parentCommentId,
    });

    return reply.populate('userId', 'name email avatar');
  }
}

export const commentService = new CommentService();
