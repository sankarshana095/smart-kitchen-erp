const prisma = require('../config/db');

// @desc    Get all notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50, // limit to latest 50
    });
    res.json(notifications);
  } catch (error) {
    console.error('Get Notifications Error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json(notification);
  } catch (error) {
    console.error('Mark Notification Read Error:', error);
    res.status(500).json({ message: 'Failed to update notification status' });
  }
};

// @desc    Clear all notifications
// @route   POST /api/notifications/clear
// @access  Private
const clearNotifications = async (req, res) => {
  try {
    await prisma.notification.deleteMany({});
    res.json({ message: 'All notifications cleared successfully' });
  } catch (error) {
    console.error('Clear Notifications Error:', error);
    res.status(500).json({ message: 'Failed to clear notifications' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  clearNotifications,
};
