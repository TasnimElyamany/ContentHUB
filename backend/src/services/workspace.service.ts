import mongoose from 'mongoose';
import crypto from 'crypto';
import { Workspace, IWorkspace, User, WorkspaceInvitation } from '../models';
import { ApiError } from '../utils/apiError';
import {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  InviteMemberInput,
} from '../schemas/workspace.schema';

const ROLE_HIERARCHY: Record<string, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

class WorkspaceService {
  async getMyWorkspaces(userId: string): Promise<IWorkspace[]> {
    return Workspace.find({
      $or: [{ owner: userId }, { 'members.userId': userId }],
    }).sort({ updatedAt: -1 });
  }

  async getWorkspaceById(
    workspaceId: string,
    userId: string
  ): Promise<IWorkspace> {
    const workspace = await Workspace.findById(workspaceId).populate(
      'members.userId',
      'name email avatar'
    );

    if (!workspace) {
      throw ApiError.notFound('Workspace not found');
    }

    // Check access
    const hasAccess =
      workspace.owner.toString() === userId ||
      workspace.members.some((m) => m.userId.toString() === userId);

    if (!hasAccess) {
      throw ApiError.forbidden('You do not have access to this workspace');
    }

    return workspace;
  }

  async createWorkspace(
    userId: string,
    data: CreateWorkspaceInput
  ): Promise<IWorkspace> {
    const workspace = await Workspace.create({
      name: data.name,
      icon: data.icon,
      description: data.description,
      owner: userId,
      members: [
        {
          userId: new mongoose.Types.ObjectId(userId),
          role: 'owner',
          joinedAt: new Date(),
        },
      ],
      settings: {
        ...data.settings,
      },
    });

    return workspace;
  }

  async updateWorkspace(
    workspaceId: string,
    userId: string,
    data: UpdateWorkspaceInput
  ): Promise<IWorkspace> {
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      throw ApiError.notFound('Workspace not found');
    }

    // Check permission
    const userRole = this.getUserRole(workspace, userId);
    if (ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY['admin']) {
      throw ApiError.forbidden('You do not have permission to update this workspace');
    }

    if (data.name) workspace.name = data.name;
    if (data.icon !== undefined) workspace.icon = data.icon || undefined;
    if (data.description !== undefined)
      workspace.description = data.description || undefined;
    if (data.settings) {
      workspace.settings = { ...workspace.settings, ...data.settings };
    }

    await workspace.save();
    return workspace;
  }

  async deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      throw ApiError.notFound('Workspace not found');
    }

    if (workspace.owner.toString() !== userId) {
      throw ApiError.forbidden('Only the owner can delete this workspace');
    }

    await Workspace.findByIdAndDelete(workspaceId);
  }

  async inviteMember(
    workspaceId: string,
    inviterId: string,
    data: InviteMemberInput
  ): Promise<IWorkspace> {
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      throw ApiError.notFound('Workspace not found');
    }

    const inviterRole = this.getUserRole(workspace, inviterId);
    if (ROLE_HIERARCHY[inviterRole] < ROLE_HIERARCHY['admin']) {
      throw ApiError.forbidden('You do not have permission to invite members');
    }

    const invitedUser = await User.findOne({ email: data.email.toLowerCase() });

    if (invitedUser) {
      const existingMember = workspace.members.find(
        (m) => m.userId.toString() === invitedUser._id.toString()
      );
      if (existingMember) {
        throw ApiError.conflict('User is already a member of this workspace');
      }

      workspace.members.push({
        userId: invitedUser._id,
        role: data.role,
        joinedAt: new Date(),
      });

      await workspace.save();
    } else {
      const token = crypto.randomBytes(32).toString('hex');

      await WorkspaceInvitation.create({
        workspaceId: workspace._id,
        email: data.email.toLowerCase(),
        role: data.role,
        invitedBy: inviterId,
        message: data.message,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 d
      });

      // In production, send email with invitation link
    }

    return workspace;
  }

  async updateMemberRole(
    workspaceId: string,
    adminId: string,
    targetUserId: string,
    newRole: 'admin' | 'editor' | 'viewer'
  ): Promise<IWorkspace> {
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      throw ApiError.notFound('Workspace not found');
    }

    // Check permission
    const adminRole = this.getUserRole(workspace, adminId);
    if (ROLE_HIERARCHY[adminRole] < ROLE_HIERARCHY['admin']) {
      throw ApiError.forbidden('You do not have permission to change roles');
    }

    // Cannot change owner role
    if (workspace.owner.toString() === targetUserId) {
      throw ApiError.badRequest('Cannot change the role of the workspace owner');
    }

    const memberIndex = workspace.members.findIndex(
      (m) => m.userId.toString() === targetUserId
    );

    if (memberIndex === -1) {
      throw ApiError.notFound('Member not found in workspace');
    }

    workspace.members[memberIndex].role = newRole;
    await workspace.save();

    return workspace;
  }

  async removeMember(
    workspaceId: string,
    adminId: string,
    targetUserId: string
  ): Promise<IWorkspace> {
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      throw ApiError.notFound('Workspace not found');
    }

    // Cannot remove owner
    if (workspace.owner.toString() === targetUserId) {
      throw ApiError.badRequest('Cannot remove the workspace owner');
    }

    // Check permission 
    const adminRole = this.getUserRole(workspace, adminId);
    const isSelfRemoval = adminId === targetUserId;

    if (!isSelfRemoval && ROLE_HIERARCHY[adminRole] < ROLE_HIERARCHY['admin']) {
      throw ApiError.forbidden('You do not have permission to remove members');
    }

    // Remove member
    workspace.members = workspace.members.filter(
      (m) => m.userId.toString() !== targetUserId
    );

    await workspace.save();
    return workspace;
  }

  async leaveWorkspace(workspaceId: string, userId: string): Promise<void> {
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      throw ApiError.notFound('Workspace not found');
    }

    if (workspace.owner.toString() === userId) {
      throw ApiError.badRequest(
        'Owner cannot leave the workspace. Transfer ownership or delete the workspace.'
      );
    }

    workspace.members = workspace.members.filter(
      (m) => m.userId.toString() !== userId
    );

    await workspace.save();
  }

  async getMembers(
    workspaceId: string,
    userId: string
  ): Promise<IWorkspace['members']> {
    const workspace = await Workspace.findById(workspaceId).populate(
      'members.userId',
      'name email avatar'
    );

    if (!workspace) {
      throw ApiError.notFound('Workspace not found');
    }

    // Check access
    const hasAccess =
      workspace.owner.toString() === userId ||
      workspace.members.some((m) => m.userId.toString() === userId);

    if (!hasAccess) {
      throw ApiError.forbidden('You do not have access to this workspace');
    }

    return workspace.members;
  }

  private getUserRole(workspace: IWorkspace, userId: string): string {
    if (workspace.owner.toString() === userId) {
      return 'owner';
    }

    const member = workspace.members.find(
      (m) => m.userId.toString() === userId
    );

    return member?.role || 'none';
  }
}

export const workspaceService = new WorkspaceService();
