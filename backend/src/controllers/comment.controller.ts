import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { commentService } from '../services/comment.service';

export const getComments = asyncHandler(async (req: Request, res: Response) => {
  const comments = await commentService.getComments(
    req.params.documentId,
    req.user!.userId
  );

  res.json({
    success: true,
    data: comments,
  });
});

export const createComment = asyncHandler(async (req: Request, res: Response) => {
  const comment = await commentService.createComment(
    req.params.documentId,
    req.user!.userId,
    req.body
  );

  res.status(201).json({
    success: true,
    data: comment,
  });
});

export const updateComment = asyncHandler(async (req: Request, res: Response) => {
  const comment = await commentService.updateComment(
    req.params.id,
    req.user!.userId,
    req.body
  );

  res.json({
    success: true,
    data: comment,
  });
});

export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  await commentService.deleteComment(req.params.id, req.user!.userId);

  res.json({
    success: true,
    message: 'Comment deleted successfully',
  });
});

export const resolveComment = asyncHandler(async (req: Request, res: Response) => {
  const comment = await commentService.resolveComment(
    req.params.id,
    req.user!.userId
  );

  res.json({
    success: true,
    data: comment,
  });
});

export const replyToComment = asyncHandler(async (req: Request, res: Response) => {
  const reply = await commentService.replyToComment(
    req.params.id,
    req.user!.userId,
    req.body.content
  );

  res.status(201).json({
    success: true,
    data: reply,
  });
});
