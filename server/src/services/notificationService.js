const prisma = require('../config/db');

/**
 * Check if ingredient stock is below minimum stock limit and create a notification if so.
 */
const checkAndCreateLowStockNotification = async (ingredientId) => {
  try {
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
    });

    if (!ingredient) return;

    if (ingredient.stock < ingredient.minStock) {
      // Check if a similar unread notification already exists in the last 24 hours
      const existingNotification = await prisma.notification.findFirst({
        where: {
          type: 'LOW_STOCK',
          message: {
            contains: `Ingredient "${ingredient.name}" is low on stock`,
          },
          isRead: false,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours
          },
        },
      });

      if (!existingNotification) {
        await prisma.notification.create({
          data: {
            title: 'Low Stock Alert',
            message: `Ingredient "${ingredient.name}" is low on stock. Current: ${ingredient.stock} ${ingredient.unit}. Min Limit: ${ingredient.minStock} ${ingredient.unit}.`,
            type: 'LOW_STOCK',
          },
        });
      }
    }
  } catch (error) {
    console.error('Error checking/creating low stock notification:', error);
  }
};

/**
 * Create a general or custom notification.
 */
const createNotification = async (title, message, type = 'GENERAL') => {
  try {
    return await prisma.notification.create({
      data: {
        title,
        message,
        type,
      },
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

module.exports = {
  checkAndCreateLowStockNotification,
  createNotification,
};
