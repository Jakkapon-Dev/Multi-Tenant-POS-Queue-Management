import { Router } from 'express';
import { getTablesByTenant, getTableByToken, updateTableStatus } from '../controllers/table.controller.js';

const router = Router();

router.get('/tenant/:tenantId', getTablesByTenant);
router.get('/token/:token', getTableByToken);
router.patch('/:id/status', updateTableStatus);

export default router;
