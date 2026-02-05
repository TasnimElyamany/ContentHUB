import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authService } from '../services/auth.service';
import { ApiError } from '../utils/apiError';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);

  res.status(201).json({
    success: true,
    data: result,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);

  res.json({
    success: true,
    data: result,
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getCurrentUser(req.user!.userId);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  res.json({
    success: true,
    data: user,
  });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.updateProfile(req.user!.userId, req.body);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  res.json({
    success: true,
    data: user,
  });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.changePassword(req.user!.userId, req.body);

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const message = await authService.forgotPassword(req.body.email);

  res.json({
    success: true,
    message,
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body.token, req.body.newPassword);

  res.json({
    success: true,
    message: 'Password reset successfully',
  });
});
