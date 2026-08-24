import { Router } from 'express';
import {
  createOrder,
  getOrdersByTenant,
  getActiveKdsOrders,
  updateOrderStatus,
  updateOrderItemStatus,
  processPayment,
} from '../controllers/order.controller.js';

const router = Router();

router.post('/', createOrder);
router.get('/tenant/:tenantId', getOrdersByTenant);
router.get('/tenant/:tenantId/kds', getActiveKdsOrders);
router.patch('/:id/status', updateOrderStatus);
router.patch('/item/:itemId/status', updateOrderItemStatus);
router.post('/:id/pay', processPayment);

export default router;
