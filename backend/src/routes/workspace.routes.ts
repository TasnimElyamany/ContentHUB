import { Router } from 'express';
import {
  getWorkspaces,
  getWorkspace,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  inviteMember,
  updateMemberRole,
  removeMember,
  leaveWorkspace,
  getMembers,
} from '../controllers/workspace.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  workspaceIdSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  removeMemberSchema,
  leaveWorkspaceSchema,
} from '../schemas/workspace.schema';

const router = Router();

router.use(authenticate);

router.get('/', getWorkspaces);
router.get('/:id', validate(workspaceIdSchema), getWorkspace);
router.post('/', validate(createWorkspaceSchema), createWorkspace);
router.put('/:id', validate(updateWorkspaceSchema), updateWorkspace);
router.delete('/:id', validate(workspaceIdSchema), deleteWorkspace);

router.post('/:workspaceId/invite', validate(inviteMemberSchema), inviteMember);
router.put(
  '/:workspaceId/members/:userId',
  validate(updateMemberRoleSchema),
  updateMemberRole
);
router.delete(
  '/:workspaceId/members/:userId',
  validate(removeMemberSchema),
  removeMember
);
router.post('/:workspaceId/leave', validate(leaveWorkspaceSchema), leaveWorkspace);
router.get('/:workspaceId/members', getMembers);

export default router;
