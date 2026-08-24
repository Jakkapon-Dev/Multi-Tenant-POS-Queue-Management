import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'pos_super_secret_jwt_key_2026';

export interface AuthenticatedUser {
  userId: string;
  tenantId: string;
  role: 'OWNER' | 'MANAGER' | 'CASHIER' | 'KITCHEN';
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. No Bearer token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized. User session missing.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden. Role '${req.user.role}' does not have permission for this action. Required: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
};

export const enforceTenantIsolation = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    next();
    return;
  }

  const requestedTenantId = req.params.tenantId || req.body.tenantId || req.query.tenantId;
  if (requestedTenantId && requestedTenantId !== req.user.tenantId) {
    res.status(403).json({
      error: 'Tenant Data Isolation: Access denied. Cannot view or alter data of a different restaurant.',
    });
    return;
  }

  next();
};
