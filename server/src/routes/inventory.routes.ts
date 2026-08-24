import { Router } from 'express';
import { getIngredientsByTenant, restockIngredient } from '../controllers/inventory.controller.js';

const router = Router();

router.get('/tenant/:tenantId', getIngredientsByTenant);
router.post('/:id/restock', restockIngredient);

export default router;
