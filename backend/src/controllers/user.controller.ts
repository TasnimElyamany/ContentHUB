import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { User } from '../models';

export const searchUsers = asyncHandler(async (req: Request, res: Response) => {
  const q = (req.query.q as string)?.trim();
  if (!q || q.length < 2) {
    res.json({ success: true, data: [] });
    return;
  }

  const users = await User.find({
    $or: [
      { email: { $regex: q, $options: 'i' } },
      { name: { $regex: q, $options: 'i' } },
    ],
    _id: { $ne: req.user!.userId },
  })
    .select('name email avatar')
    .limit(8);

  res.json({ success: true, data: users });
});
