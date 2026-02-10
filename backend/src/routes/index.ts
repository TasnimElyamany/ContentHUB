import { Router } from 'express';
import authRoutes from './auth.routes';
import workspaceRoutes from './workspace.routes';
import documentRoutes from './document.routes';
import commentRoutes from './comment.routes';
import aiRoutes from './ai.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/documents', documentRoutes);
router.use('/comments', commentRoutes);
router.use('/ai', aiRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
