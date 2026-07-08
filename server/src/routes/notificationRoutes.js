const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  clearNotifications,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.post('/clear', clearNotifications);

module.exports = router;
