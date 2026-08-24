import { Router } from 'express';
import { getMenuByTenant, createMenuItem, updateMenuItemAvailability } from '../controllers/menu.controller.js';

const router = Router();

router.get('/tenant/:tenantId', getMenuByTenant);
router.post('/', createMenuItem);
router.patch('/:id/availability', updateMenuItemAvailability);

export default router;
