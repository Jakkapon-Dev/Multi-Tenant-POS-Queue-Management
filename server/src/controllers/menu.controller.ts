import { Request, Response } from 'express';
import prisma from '../config/prisma.js';

export const getMenuByTenant = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.params.tenantId as string;
    const categories = await prisma.category.findMany({
      where: { tenantId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        menuItems: {
          orderBy: { sortOrder: 'asc' },
          include: {
            modifierGroups: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenantId, categoryId, name, description, price, imageUrl, prepTimeMinutes, modifierGroups } = req.body;
    if (!tenantId || !categoryId || !name || price === undefined) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const item = await prisma.menuItem.create({
      data: {
        tenantId,
        categoryId,
        name,
        description,
        price: parseFloat(price),
        imageUrl,
        prepTimeMinutes: prepTimeMinutes ? parseInt(prepTimeMinutes) : 5,
        modifierGroups: modifierGroups && modifierGroups.length > 0 ? {
          create: modifierGroups.map((g: any) => ({
            name: g.name,
            isRequired: g.isRequired || false,
            minSelect: g.minSelect || 0,
            maxSelect: g.maxSelect || 1,
            options: {
              create: (g.options || []).map((o: any) => ({
                name: o.name,
                extraPrice: parseFloat(o.extraPrice || '0'),
              })),
            },
          })),
        } : undefined,
      },
      include: {
        modifierGroups: {
          include: { options: true },
        },
      },
    });

    res.status(201).json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateMenuItemAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { isAvailable } = req.body;

    const item = await prisma.menuItem.update({
      where: { id },
      data: { isAvailable },
    });

    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
