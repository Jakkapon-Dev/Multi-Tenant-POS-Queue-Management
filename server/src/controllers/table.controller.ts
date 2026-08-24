import { Request, Response } from 'express';
import prisma from '../config/prisma.js';

export const getTablesByTenant = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.params.tenantId as string;
    const tables = await prisma.diningTable.findMany({
      where: { tenantId },
      orderBy: { tableNumber: 'asc' },
      include: {
        orders: {
          where: {
            status: { notIn: ['COMPLETED', 'CANCELLED'] },
          },
          include: {
            items: true,
          },
          take: 1,
        },
      },
    });

    res.json(tables);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getTableByToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.params.token as string;
    const table = await prisma.diningTable.findUnique({
      where: { qrCodeToken: token },
      include: {
        tenant: true,
        orders: {
          where: {
            status: { notIn: ['COMPLETED', 'CANCELLED'] },
          },
          include: {
            items: true,
          },
          take: 1,
        },
      },
    });

    if (!table) {
      res.status(404).json({ error: 'Table or QR code not found' });
      return;
    }

    res.json(table);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateTableStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const table = await prisma.diningTable.update({
      where: { id },
      data: { status },
    });

    res.json(table);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
