const prisma = require('../config/db');
const { checkAndCreateLowStockNotification } = require('../services/notificationService');

// @desc    Add purchased stock (Stock IN)
// @route   POST /api/inventory/stock-in
// @access  Private
const stockIn = async (req, res) => {
  const { ingredientId, quantity, reason } = req.body;

  if (!ingredientId || !quantity) {
    return res.status(400).json({ message: 'Ingredient ID and quantity are required' });
  }

  const amount = parseFloat(quantity);
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Quantity must be a positive number' });
  }

  try {
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
    });

    if (!ingredient) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Increment stock
      const ing = await tx.ingredient.update({
        where: { id: ingredientId },
        data: {
          stock: {
            increment: amount,
          },
        },
      });

      // 2. Log transaction
      await tx.stockTransaction.create({
        data: {
          ingredientId,
          quantity: amount,
          type: 'STOCK_IN',
          reason: reason || 'Purchased stock addition',
          userId: req.user.id,
        },
      });

      return ing;
    });

    // Check low stock alert status asynchronously
    await checkAndCreateLowStockNotification(ingredientId);

    res.status(200).json({
      message: 'Stock increased successfully',
      ingredient: updated,
    });
  } catch (error) {
    console.error('Stock In Error:', error);
    res.status(500).json({ message: 'Failed to process Stock In operation' });
  }
};

// @desc    Deduct stock manually / wastage (Stock OUT)
// @route   POST /api/inventory/stock-out
// @access  Private
const stockOut = async (req, res) => {
  const { ingredientId, quantity, type, reason } = req.body;

  if (!ingredientId || !quantity) {
    return res.status(400).json({ message: 'Ingredient ID and quantity are required' });
  }

  const amount = parseFloat(quantity);
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Quantity must be a positive number' });
  }

  const transactionType = type === 'WASTAGE' ? 'WASTAGE' : 'STOCK_OUT';

  try {
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
    });

    if (!ingredient) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Decrement stock
      const ing = await tx.ingredient.update({
        where: { id: ingredientId },
        data: {
          stock: {
            decrement: amount,
          },
        },
      });

      // 2. Log transaction
      await tx.stockTransaction.create({
        data: {
          ingredientId,
          quantity: -amount,
          type: transactionType,
          reason: reason || (transactionType === 'WASTAGE' ? 'Wastage write-off' : 'Manual stock deduction'),
          userId: req.user.id,
        },
      });

      return ing;
    });

    // Check low stock alert status asynchronously
    await checkAndCreateLowStockNotification(ingredientId);

    res.status(200).json({
      message: 'Stock deducted successfully',
      ingredient: updated,
    });
  } catch (error) {
    console.error('Stock Out Error:', error);
    res.status(500).json({ message: 'Failed to process Stock Out operation' });
  }
};

// @desc    Get all transactions history
// @route   GET /api/inventory/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const transactions = await prisma.stockTransaction.findMany({
      include: {
        ingredient: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(transactions);
  } catch (error) {
    console.error('Get Transactions Error:', error);
    res.status(500).json({ message: 'Failed to fetch transaction history' });
  }
};

module.exports = {
  stockIn,
  stockOut,
  getTransactions,
};
