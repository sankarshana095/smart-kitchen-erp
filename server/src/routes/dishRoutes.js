const express = require('express');
const router = express.Router();
const {
  getDishes,
  getDishById,
  createDish,
  updateDish,
  deleteDish,
} = require('../controllers/dishController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router
  .route('/')
  .get(getDishes)
  .post(restrictTo('ADMIN', 'STORE_MANAGER'), createDish);

router
  .route('/:id')
  .get(getDishById)
  .put(restrictTo('ADMIN', 'STORE_MANAGER'), updateDish)
  .delete(restrictTo('ADMIN'), deleteDish);

module.exports = router;
