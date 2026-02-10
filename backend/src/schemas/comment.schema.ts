import { z } from 'zod';

export const createCommentSchema = z.object({
  params: z.object({
    documentId: z.string().min(1, 'Document ID is required'),
  }),
  body: z.object({
    content: z.string().min(1, 'Comment content is required').max(2000),
    position: z.object({
      start: z.number().int().min(0),
      end: z.number().int().min(0),
    }),
    parentCommentId: z.string().optional(),
  }),
});

export const updateCommentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Comment ID is required'),
  }),
  body: z.object({
    content: z.string().min(1).max(2000),
  }),
});

export const commentIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Comment ID is required'),
  }),
});

export const documentCommentsSchema = z.object({
  params: z.object({
    documentId: z.string().min(1, 'Document ID is required'),
  }),
});

export const replyCommentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Comment ID is required'),
  }),
  body: z.object({
    content: z.string().min(1, 'Reply content is required').max(2000),
  }),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>['body'];
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>['body'];
export type ReplyCommentInput = z.infer<typeof replyCommentSchema>['body'];
