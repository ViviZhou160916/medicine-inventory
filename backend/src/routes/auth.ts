import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import * as authController from '../controllers/authController';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/password', authMiddleware, authController.changePassword);

export default router;
