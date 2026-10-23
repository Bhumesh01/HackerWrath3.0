import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors.js';

export interface GuestUser {
  id: string;
}

declare global {
  namespace Express {
    interface Request {
      user: GuestUser;
    }
  }
}

/** Anonymous browser scope only; this identifier is not authentication or proof of ownership. */
export function anonymousIdentity(req: Request, _res: Response, next: NextFunction): void {
  if (req.path === '/share' || req.path.startsWith('/share/')) return next();
  const guestId = req.header('X-Kaali-Guest-ID');
  if (!guestId || !/^[a-f\d]{24}$/i.test(guestId)) {
    return next(AppError.badRequest('A valid X-Kaali-Guest-ID browser identifier is required'));
  }
  req.user = { id: guestId.toLowerCase() };
  next();
}
