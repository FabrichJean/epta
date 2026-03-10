import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyKey } from '../utils/auth';


export interface AuthRequest extends Request {
  userId?: number;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
    const apiKey = req.headers.key;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
      req.userId = decoded.userId;
    }else if(apiKey){
      const {id} = await verifyKey(apiKey as string);
      req.userId = id;
    }else{
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
