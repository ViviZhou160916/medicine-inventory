import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as dashboardController from '../controllers/dashboardController';

const router = Router();

// All dashboard routes require authentication
router.use(authMiddleware);

router.get('/', dashboardController.getDashboardData);
router.get('/stock-trend', dashboardController.getStockTrend);
router.get('/category-stats', dashboardController.getCategoryStats);

export default router;
