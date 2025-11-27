import express from 'express';
import {
  subscribeStockAlert,
  unsubscribeStockAlert,
  checkStockAlert,
  getMyStockAlerts,
} from '../controllers/stockAlertController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', subscribeStockAlert);
router.get('/my', getMyStockAlerts);
router.get('/check/:productId', checkStockAlert);
router.delete('/:productId', unsubscribeStockAlert);

export default router;
