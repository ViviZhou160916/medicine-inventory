import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as inventoryController from '../controllers/inventoryController';

const router = Router();

// All inventory routes require authentication
router.use(authMiddleware);

router.post('/inbound', inventoryController.inbound);
router.post('/outbound', inventoryController.outbound);
router.get('/inbound/records', inventoryController.getInboundRecords);
router.get('/outbound/records', inventoryController.getOutboundRecords);
router.get('/stats', inventoryController.getInventoryStats);

export default router;
