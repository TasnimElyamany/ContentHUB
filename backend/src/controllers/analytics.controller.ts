import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { analyticsService } from '../services/analytics.service';

export const getWorkspaceStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await analyticsService.getWorkspaceStats(
    req.params.workspaceId,
    req.user!.userId
  );

  res.json({
    success: true,
    data: stats,
  });
});

export const getUserActivity = asyncHandler(async (req: Request, res: Response) => {
  const activity = await analyticsService.getUserActivity(req.user!.userId);

  res.json({
    success: true,
    data: activity,
  });
});

export const getAIUsageStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await analyticsService.getAIUsageStats(
    req.user!.userId,
    req.query.workspaceId as string | undefined
  );

  res.json({
    success: true,
    data: stats,
  });
});
