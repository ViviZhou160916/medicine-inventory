import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as medicineController from '../controllers/medicineController';

const router = Router();

// All medicine routes require authentication
router.use(authMiddleware);

router.get('/', medicineController.getMedicines);
router.get('/categories', medicineController.getCategories);
router.get('/expiring', medicineController.getExpiringMedicines);
router.get('/low-stock', medicineController.getLowStockMedicines);
router.get('/barcode/:barcode', medicineController.searchByBarcode);
router.get('/:id', medicineController.getMedicineById);
router.post('/', medicineController.createMedicine);
router.put('/:id', medicineController.updateMedicine);
router.delete('/:id', medicineController.deleteMedicine);

export default router;
