import { Router } from 'express';
import {
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  addCollaborator,
  removeCollaborator,
} from '../controllers/document.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createDocumentSchema,
  updateDocumentSchema,
  documentIdSchema,
  listDocumentsSchema,
  addCollaboratorSchema,
  removeCollaboratorSchema,
} from '../schemas/document.schema';

const router = Router();

router.use(authenticate);

router.get('/', validate(listDocumentsSchema), getDocuments);
router.get('/:id', validate(documentIdSchema), getDocument);
router.post('/', validate(createDocumentSchema), createDocument);
router.put('/:id', validate(updateDocumentSchema), updateDocument);
router.delete('/:id', validate(documentIdSchema), deleteDocument);

router.post('/:id/collaborators', validate(addCollaboratorSchema), addCollaborator);
router.delete(
  '/:id/collaborators/:userId',
  validate(removeCollaboratorSchema),
  removeCollaborator
);

export default router;
