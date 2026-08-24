import { Request, Response } from 'express';
import prisma from '../config/prisma.js';

export const getIngredientsByTenant = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.params.tenantId as string;
    const ingredients = await prisma.ingredient.findMany({
      where: { tenantId },
      include: {
        recipeItems: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(ingredients);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const restockIngredient = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { amountToAdd } = req.body;

    if (!amountToAdd || isNaN(amountToAdd)) {
      res.status(400).json({ error: 'Valid amountToAdd is required' });
      return;
    }

    const updated = await prisma.ingredient.update({
      where: { id },
      data: {
        currentStock: {
          increment: parseFloat(amountToAdd),
        },
      },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
