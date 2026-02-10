import { Router } from 'express';
import {
  getWorkspaceStats,
  getUserActivity,
  getAIUsageStats,
} from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/workspace/:workspaceId', getWorkspaceStats);
router.get('/user', getUserActivity);
router.get('/ai-usage', getAIUsageStats);

export default router;
