const express = require('express');
const router = express.Router();
const {
  calculateIngredients,
  executeCooking,
  getCookingHistory,
} = require('../controllers/cookingController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.post('/calculate', calculateIngredients);
router.post('/execute', restrictTo('ADMIN', 'STORE_MANAGER', 'KITCHEN_STAFF'), executeCooking);
router.get('/history', getCookingHistory);

module.exports = router;
