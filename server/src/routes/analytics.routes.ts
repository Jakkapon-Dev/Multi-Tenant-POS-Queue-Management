import { Router } from 'express';
import { getTenantAnalytics } from '../controllers/analytics.controller.js';

const router = Router();

router.get('/tenant/:tenantId', getTenantAnalytics);

export default router;
