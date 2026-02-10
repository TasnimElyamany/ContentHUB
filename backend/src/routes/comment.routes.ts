import { Router } from 'express';
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  resolveComment,
  replyToComment,
} from '../controllers/comment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createCommentSchema,
  updateCommentSchema,
  commentIdSchema,
  documentCommentsSchema,
  replyCommentSchema,
} from '../schemas/comment.schema';

const router = Router();

router.use(authenticate);

router.get(
  '/documents/:documentId/comments',
  validate(documentCommentsSchema),
  getComments
);
router.post(
  '/documents/:documentId/comments',
  validate(createCommentSchema),
  createComment
);

//for individual 
router.put('/:id', validate(updateCommentSchema), updateComment);
router.delete('/:id', validate(commentIdSchema), deleteComment);
router.post('/:id/resolve', validate(commentIdSchema), resolveComment);
router.post('/:id/reply', validate(replyCommentSchema), replyToComment);

export default router;
