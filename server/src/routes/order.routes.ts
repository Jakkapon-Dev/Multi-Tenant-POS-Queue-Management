import { Router, type RequestHandler } from 'express';
import { enforceTenantIsolation, requireAuth } from '../middleware/auth.middleware.js';
import {
  createOrder,
  getOrdersByTenant,
  getActiveKdsOrders,
  updateOrderStatus,
  updateOrderItemStatus,
  processPayment,
} from '../controllers/order.controller.js';

const router = Router();

const requireOrderListAccess: RequestHandler = (req, res, next) => {
  const localDemo = process.env.NODE_ENV === 'development' && process.env.DEMO_MODE === 'true';
  const loopback = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress ?? '');
  if (localDemo && loopback && req.headers.authorization === undefined) {
    next();
    return;
  }

  requireAuth(req, res, () => enforceTenantIsolation(req, res, next));
};

router.post('/', createOrder);
router.get('/tenant/:tenantId', requireOrderListAccess, getOrdersByTenant);
router.get('/tenant/:tenantId/kds', requireOrderListAccess, getActiveKdsOrders);
router.patch('/:id/status', updateOrderStatus);
router.patch('/item/:itemId/status', updateOrderItemStatus);
router.post('/:id/pay', processPayment);

export default router;
