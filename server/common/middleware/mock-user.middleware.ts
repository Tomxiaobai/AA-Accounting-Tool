import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

// Extend Express Request to include userContext
declare global {
  namespace Express {
    interface Request {
      userContext: {
        userId: string;
        userName?: string;
      };
      __platform_data__?: Record<string, unknown>;
    }
  }
}

@Injectable()
export class MockUserMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    // Use header-based user ID or default mock user
    const userId = req.headers['x-user-id'] as string || 'user_default';
    const rawName = req.headers['x-user-name'] as string || '%E9%BB%98%E8%AE%A4%E7%94%A8%E6%88%B7';
    const userName = decodeURIComponent(rawName);

    req.userContext = { userId, userName };
    next();
  }
}
