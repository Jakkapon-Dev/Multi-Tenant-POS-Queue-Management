import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

import { JWT_SECRET } from '../config/auth.js';

export const loginWithEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, tenantSlug } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    let tenant = null;
    if (tenantSlug) {
      tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    }

    const whereClause: any = { email };
    if (tenant) {
      whereClause.tenantId = tenant.id;
    }

    const user = await prisma.user.findFirst({
      where: whereClause,
      include: { tenant: true },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials or store not found' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenantId, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tenant: user.tenant,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
};

export const loginWithPin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pinCode, tenantId } = req.body;
    if (!pinCode || !tenantId) {
      res.status(400).json({ error: 'PIN and Tenant ID are required' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: { pinCode, tenantId },
      include: { tenant: true },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid PIN code' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenantId, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tenant: user.tenant,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
};

export const getMe = async (req: any, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { tenant: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tenant: user.tenant,
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
