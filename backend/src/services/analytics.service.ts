import mongoose from 'mongoose';
import { Workspace, ContentDocument, AIUsage, User } from '../models';
import { ApiError } from '../utils/apiError';

interface WorkspaceStats {
  totalDocuments: number;
  totalMembers: number;
  aiCreditsUsed: number;
  documentsCreatedThisMonth: number;
  activeMembers: number;
}

interface UserActivity {
  documentsCreated: number;
  documentsEdited: number;
  commentsAdded: number;
  aiRequestsMade: number;
}

interface AIUsageStats {
  totalRequests: number;
  totalTokens: number;
  byAction: Record<string, number>;
  byDay: { date: string; count: number }[];
}

class AnalyticsService {
  async getWorkspaceStats(
    workspaceId: string,
    userId: string
  ): Promise<WorkspaceStats> {
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      throw ApiError.notFound('Workspace not found');
    }

    const hasAccess =
      workspace.owner.toString() === userId ||
      workspace.members.some((m) => m.userId.toString() === userId);

    if (!hasAccess) {
      throw ApiError.forbidden('You do not have access to this workspace');
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalDocuments,
      documentsCreatedThisMonth,
      aiUsage,
      activeMembers,
    ] = await Promise.all([
      ContentDocument.countDocuments({ workspace: workspaceId }),
      ContentDocument.countDocuments({
        workspace: workspaceId,
        createdAt: { $gte: startOfMonth },
      }),
      AIUsage.aggregate([
        {
          $match: {
            workspaceId: new mongoose.Types.ObjectId(workspaceId),
          },
        },
        {
          $group: {
            _id: null,
            totalTokens: { $sum: '$tokensUsed' },
          },
        },
      ]),
      ContentDocument.distinct('owner', {
        workspace: workspaceId,
        updatedAt: { $gte: sevenDaysAgo },
      }),
    ]);

    return {
      totalDocuments,
      totalMembers: workspace.members.length,
      aiCreditsUsed: aiUsage[0]?.totalTokens || 0,
      documentsCreatedThisMonth,
      activeMembers: activeMembers.length,
    };
  }

  async getUserActivity(userId: string): Promise<UserActivity> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [documentsCreated, aiRequests] = await Promise.all([
      ContentDocument.countDocuments({
        owner: userId,
        createdAt: { $gte: thirtyDaysAgo },
      }),
      AIUsage.countDocuments({
        userId,
        createdAt: { $gte: thirtyDaysAgo },
      }),
    ]);

    const documentsEdited = await ContentDocument.countDocuments({
      $or: [
        { owner: userId },
        { 'collaborators.userId': userId },
      ],
      updatedAt: { $gte: thirtyDaysAgo },
    });

    return {
      documentsCreated,
      documentsEdited,
      commentsAdded: 0, 
      aiRequestsMade: aiRequests,
    };
  }

  async getAIUsageStats(
    userId: string,
    workspaceId?: string
  ): Promise<AIUsageStats> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const matchQuery: any = {
      userId: new mongoose.Types.ObjectId(userId),
      createdAt: { $gte: thirtyDaysAgo },
    };

    if (workspaceId) {
      matchQuery.workspaceId = new mongoose.Types.ObjectId(workspaceId);
    }

    const [totalStats, byAction, byDay] = await Promise.all([
      AIUsage.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            totalTokens: { $sum: '$tokensUsed' },
          },
        },
      ]),
      AIUsage.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
          },
        },
      ]),
      AIUsage.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const byActionMap: Record<string, number> = {};
    byAction.forEach((item: any) => {
      byActionMap[item._id] = item.count;
    });

    return {
      totalRequests: totalStats[0]?.totalRequests || 0,
      totalTokens: totalStats[0]?.totalTokens || 0,
      byAction: byActionMap,
      byDay: byDay.map((item: any) => ({
        date: item._id,
        count: item.count,
      })),
    };
  }
}

export const analyticsService = new AnalyticsService();
