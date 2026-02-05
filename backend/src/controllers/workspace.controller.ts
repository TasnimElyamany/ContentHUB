import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { workspaceService } from '../services/workspace.service';

export const getWorkspaces = asyncHandler(async (req: Request, res: Response) => {
  const workspaces = await workspaceService.getMyWorkspaces(req.user!.userId);

  res.json({
    success: true,
    data: workspaces,
  });
});

export const getWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const workspace = await workspaceService.getWorkspaceById(
    req.params.id,
    req.user!.userId
  );

  res.json({
    success: true,
    data: workspace,
  });
});

export const createWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const workspace = await workspaceService.createWorkspace(
    req.user!.userId,
    req.body
  );

  res.status(201).json({
    success: true,
    data: workspace,
  });
});

export const updateWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const workspace = await workspaceService.updateWorkspace(
    req.params.id,
    req.user!.userId,
    req.body
  );

  res.json({
    success: true,
    data: workspace,
  });
});

export const deleteWorkspace = asyncHandler(async (req: Request, res: Response) => {
  await workspaceService.deleteWorkspace(req.params.id, req.user!.userId);

  res.json({
    success: true,
    message: 'Workspace deleted successfully',
  });
});

export const inviteMember = asyncHandler(async (req: Request, res: Response) => {
  const workspace = await workspaceService.inviteMember(
    req.params.workspaceId,
    req.user!.userId,
    req.body
  );

  res.json({
    success: true,
    data: workspace,
  });
});

export const updateMemberRole = asyncHandler(async (req: Request, res: Response) => {
  const workspace = await workspaceService.updateMemberRole(
    req.params.workspaceId,
    req.user!.userId,
    req.params.userId,
    req.body.role
  );

  res.json({
    success: true,
    data: workspace,
  });
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  const workspace = await workspaceService.removeMember(
    req.params.workspaceId,
    req.user!.userId,
    req.params.userId
  );

  res.json({
    success: true,
    data: workspace,
  });
});

export const leaveWorkspace = asyncHandler(async (req: Request, res: Response) => {
  await workspaceService.leaveWorkspace(req.params.workspaceId, req.user!.userId);

  res.json({
    success: true,
    message: 'Successfully left the workspace',
  });
});

export const getMembers = asyncHandler(async (req: Request, res: Response) => {
  const members = await workspaceService.getMembers(
    req.params.workspaceId,
    req.user!.userId
  );

  res.json({
    success: true,
    data: members,
  });
});
