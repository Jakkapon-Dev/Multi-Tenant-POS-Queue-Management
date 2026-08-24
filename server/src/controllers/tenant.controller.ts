import { Request, Response } from 'express';
import prisma from '../config/prisma.js';

export const getAllTenants = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true, pinCode: true },
        },
        tables: {
          select: { id: true, tableNumber: true, zone: true, qrCodeToken: true, status: true },
        },
        _count: {
          select: { menuItems: true, orders: true },
        },
      },
    });
    res.json(tenants);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getTenantBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params.slug as string;
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            menuItems: {
              where: { isAvailable: true },
              orderBy: { sortOrder: 'asc' },
              include: {
                modifierGroups: {
                  include: { options: true },
                },
              },
            },
          },
        },
        tables: {
          orderBy: { tableNumber: 'asc' },
        },
      },
    });

    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    res.json(tenant);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
