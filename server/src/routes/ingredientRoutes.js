const express = require('express');
const router = express.Router();
const {
  getIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  deleteIngredient,
} = require('../controllers/ingredientController');
const { protect, restrictTo } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router
  .route('/')
  .get(getIngredients)
  .post(restrictTo('ADMIN', 'STORE_MANAGER'), createIngredient);

router
  .route('/:id')
  .get(getIngredientById)
  .put(restrictTo('ADMIN', 'STORE_MANAGER'), updateIngredient)
  .delete(restrictTo('ADMIN'), deleteIngredient); // Only Admin can delete ingredients

module.exports = router;
