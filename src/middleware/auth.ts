import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { validateApiKey } from '../utils/apiKey';
import { User } from '@prisma/client';


export interface AuthRequest extends Request {
  userId?: number;
  user?: Partial<User> & { [key: string]: any };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
    const apiKey = req.headers['x-api-key'] as string; // Custom header for API keys

    if (token) {
      // JWT Token authentication
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
      req.userId = decoded.userId;
      req.user = {id: req.userId};
    } else if (apiKey) {
      // API Key authentication
      const validation = await validateApiKey(apiKey);
      if (!validation) {
        return res.status(401).json({ error: 'Invalid or expired API key' });
      }
      req.userId = validation.userId;
      req.user = {...validation.user, isApi: true};
    } else {
      return res.status(401).json({ error: 'Authentication required. Provide either Bearer token or X-API-Key header.' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
