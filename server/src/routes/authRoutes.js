const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  getAllUsers,
  updateUserRole,
  deleteUser,
} = require('../controllers/authController');
const { protect, restrictTo } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);

// Admin-only user management routes
router.get('/users', protect, restrictTo('ADMIN'), getAllUsers);
router.put('/users/:id/role', protect, restrictTo('ADMIN'), updateUserRole);
router.delete('/users/:id', protect, restrictTo('ADMIN'), deleteUser);

module.exports = router;
