import { Server, Socket } from 'socket.io';
import prisma from '../config/prisma.js';

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 [Socket.io] Client connected: ${socket.id}`);

    // Join tenant specific room (Data isolation in WebSocket)
    socket.on('join:tenant', (tenantId: string) => {
      if (tenantId) {
        socket.join(`tenant:${tenantId}`);
        console.log(`📡 [Socket.io] ${socket.id} joined tenant room: tenant:${tenantId}`);
      }
    });

    // Customer joining individual order tracking room
    socket.on('join:order', (orderId: string) => {
      if (orderId) {
        socket.join(`order:${orderId}`);
        console.log(`📡 [Socket.io] ${socket.id} joined order room: order:${orderId}`);
      }
    });

    // Bumping order from KDS
    socket.on('kds:bump_order', async (data: { orderId: string; nextStatus: string }) => {
      try {
        const updatedOrder = await prisma.order.update({
          where: { id: data.orderId },
          data: { status: data.nextStatus },
          include: { items: true, table: true },
        });

        // Broadcast to entire tenant
        io.to(`tenant:${updatedOrder.tenantId}`).emit('order:status_updated', updatedOrder);
        // Broadcast to customer tracking room
        io.to(`order:${updatedOrder.id}`).emit('order:customer_update', updatedOrder);
      } catch (err) {
        console.error('Failed to bump order status via socket:', err);
      }
    });

    // Bumping single dish item from KDS
    socket.on('kds:bump_item', async (data: { itemId: string; status: string }) => {
      try {
        const item = await prisma.orderItem.update({
          where: { id: data.itemId },
          data: { status: data.status },
          include: {
            order: {
              include: { items: true, table: true },
            },
          },
        });

        io.to(`tenant:${item.order.tenantId}`).emit('order:status_updated', item.order);
        io.to(`order:${item.order.id}`).emit('order:customer_update', item.order);
      } catch (err) {
        console.error('Failed to bump item status via socket:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 [Socket.io] Client disconnected: ${socket.id}`);
    });
  });
};
