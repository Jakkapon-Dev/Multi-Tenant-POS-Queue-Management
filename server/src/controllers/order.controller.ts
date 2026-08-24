import { Request, Response } from 'express';
import prisma from '../config/prisma.js';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenantId, tableId, customerName, orderType, notes, items } = req.body;

    if (!tenantId || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Tenant ID and at least one order item are required' });
      return;
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    // Generate daily order number
    const todayCount = await prisma.order.count({
      where: { tenantId },
    });
    const orderNumber = `#${String(todayCount + 1).padStart(3, '0')}`;

    // Calculate subtotal
    let subtotal = 0;
    const orderItemsData = items.map((item: any) => {
      const itemSubtotal = item.price * (item.quantity || 1);
      subtotal += itemSubtotal;
      return {
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        subtotal: itemSubtotal,
        status: 'QUEUED',
        notes: item.notes || null,
        modifiers: item.modifiers ? JSON.stringify(item.modifiers) : null,
      };
    });

    const tax = Math.round((subtotal * (tenant.taxRate / 100)) * 100) / 100;
    const serviceFee = Math.round((subtotal * (tenant.serviceFee / 100)) * 100) / 100;
    const total = Math.round((subtotal + tax + serviceFee) * 100) / 100;

    const order = await prisma.order.create({
      data: {
        tenantId,
        tableId: tableId || null,
        orderNumber,
        customerName: customerName || (tableId ? 'Dine-In Customer' : 'Takeaway Customer'),
        orderType: orderType || (tableId ? 'DINE_IN' : 'TAKEAWAY'),
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        subtotal,
        tax,
        serviceFee,
        total,
        notes: notes || null,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: true,
        table: true,
        tenant: true,
      },
    });

    // Update table status if dine-in
    if (tableId) {
      await prisma.diningTable.update({
        where: { id: tableId },
        data: {
          status: 'OCCUPIED',
          currentOrderId: order.id,
        },
      });
    }

    // Auto deduct inventory based on recipes
    try {
      for (const item of items) {
        const recipes = await prisma.recipeItem.findMany({
          where: { menuItemId: item.menuItemId },
        });

        for (const recipe of recipes) {
          const qtyToDeduct = recipe.quantityRequired * (item.quantity || 1);
          await prisma.ingredient.update({
            where: { id: recipe.ingredientId },
            data: {
              currentStock: {
                decrement: qtyToDeduct,
              },
            },
          });
        }
      }
    } catch (recipeErr) {
      console.warn('Inventory auto-deduction note:', recipeErr);
    }

    // Broadcast WebSocket event
    const io = req.app.get('io');
    if (io) {
      io.to(`tenant:${tenantId}`).emit('order:created', order);
      io.to(`tenant:${tenantId}`).emit('kds:new_order', order);
      if (tableId) {
        io.to(`tenant:${tenantId}`).emit('table:updated', { tableId, status: 'OCCUPIED' });
      }
    }

    res.status(201).json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getOrdersByTenant = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.params.tenantId as string;
    const { status, limit } = req.query;

    const where: any = { tenantId };
    if (status && typeof status === 'string') {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit as string) : 50,
      include: {
        items: true,
        table: true,
      },
    });

    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getActiveKdsOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.params.tenantId as string;

    const orders = await prisma.order.findMany({
      where: {
        tenantId,
        status: { in: ['PENDING', 'PREPARING', 'READY'] },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        items: true,
        table: true,
      },
    });

    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: true,
        table: true,
      },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`tenant:${order.tenantId}`).emit('order:status_updated', order);
      io.to(`order:${order.id}`).emit('order:customer_update', order);
    }

    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateOrderItemStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const itemId = req.params.itemId as string;
    const { status } = req.body;

    const orderItem = await prisma.orderItem.update({
      where: { id: itemId },
      data: { status },
    });

    const fullOrder = await prisma.order.findUnique({
      where: { id: orderItem.orderId },
      include: { items: true, table: true },
    });

    if (fullOrder) {
      const io = req.app.get('io');
      if (io) {
        io.to(`tenant:${fullOrder.tenantId}`).emit('order:status_updated', fullOrder);
        io.to(`order:${fullOrder.id}`).emit('order:customer_update', fullOrder);
      }
    }

    res.json(orderItem);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const processPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { paymentMethod, discount = 0 } = req.body;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { table: true },
    });

    if (!existingOrder) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const finalDiscount = parseFloat(discount) || 0;
    const finalTotal = Math.max(0, existingOrder.subtotal + existingOrder.tax + existingOrder.serviceFee - finalDiscount);

    const order = await prisma.order.update({
      where: { id },
      data: {
        paymentStatus: 'PAID',
        status: 'COMPLETED',
        paymentMethod: paymentMethod || 'CASH',
        discount: finalDiscount,
        total: finalTotal,
      },
      include: {
        items: true,
        table: true,
      },
    });

    // Free the table
    if (order.tableId) {
      await prisma.diningTable.update({
        where: { id: order.tableId },
        data: {
          status: 'AVAILABLE',
          currentOrderId: null,
        },
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`tenant:${order.tenantId}`).emit('order:completed', order);
      if (order.tableId) {
        io.to(`tenant:${order.tenantId}`).emit('table:updated', { tableId: order.tableId, status: 'AVAILABLE' });
      }
      io.to(`order:${order.id}`).emit('order:customer_update', order);
    }

    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
