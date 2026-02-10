import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/token';
import { ApiError } from '../utils/apiError';

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('No token provided');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    throw ApiError.unauthorized('Invalid or expired token');
  }
};

// Anonymus user (future use)
export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = verifyToken(token);
      req.user = decoded;
    } catch (error) {
      // Token invalid, but that's ok for optional auth
    }
  }

  next();
};
