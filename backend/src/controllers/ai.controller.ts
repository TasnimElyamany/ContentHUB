import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { aiService } from '../services/ai.service';

export const generate = asyncHandler(async (req: Request, res: Response) => {
  const result = await aiService.generate(req.user!.userId, req.body);

  res.json({
    success: true,
    data: result,
  });
});

export const enhance = asyncHandler(async (req: Request, res: Response) => {
  const result = await aiService.enhance(req.user!.userId, req.body);

  res.json({
    success: true,
    data: result,
  });
});

export const getCredits = asyncHandler(async (req: Request, res: Response) => {
  const credits = await aiService.getCredits(req.user!.userId);

  res.json({
    success: true,
    data: credits,
  });
});
