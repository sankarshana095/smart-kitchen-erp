const express = require('express');
const router = express.Router();
const {
  stockIn,
  stockOut,
  getTransactions,
} = require('../controllers/inventoryController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.post('/stock-in', restrictTo('ADMIN', 'STORE_MANAGER'), stockIn);
router.post('/stock-out', restrictTo('ADMIN', 'STORE_MANAGER'), stockOut);
router.get('/transactions', getTransactions);

module.exports = router;
