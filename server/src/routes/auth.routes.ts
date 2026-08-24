import { Router } from 'express';
import { loginWithEmail, loginWithPin, getMe } from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', loginWithEmail);
router.post('/login-pin', loginWithPin);
router.get('/me', getMe);

export default router;
