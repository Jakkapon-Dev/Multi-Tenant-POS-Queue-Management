import { Router } from 'express';
import { getAllTenants, getTenantBySlug } from '../controllers/tenant.controller.js';

const router = Router();

router.get('/', getAllTenants);
router.get('/slug/:slug', getTenantBySlug);

export default router;
