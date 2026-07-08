const prisma = require('../config/db');
const { checkAndCreateLowStockNotification, createNotification } = require('../services/notificationService');

// @desc    Calculate required ingredients for a dish and people count
// @route   POST /api/cooking/calculate
// @access  Private
const calculateIngredients = async (req, res) => {
  const { dishId, peopleCount } = req.body;

  if (!dishId || !peopleCount) {
    return res.status(400).json({ message: 'Dish ID and People Count are required' });
  }

  const count = parseInt(peopleCount);
  if (isNaN(count) || count < 5) {
    return res.status(400).json({ message: 'People count must be at least 5' });
  }

  try {
    const dish = await prisma.dish.findUnique({
      where: { id: dishId },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!dish) {
      return res.status(404).json({ message: 'Dish not found' });
    }

    const calculations = dish.ingredients.map((di) => {
      const required = (di.quantityPerPerson * count) / 5;
      const current = di.ingredient.stock;
      const shortage = required > current ? required - current : 0;
      const remaining = current - required;
      const willBeLowStock = remaining < di.ingredient.minStock;

      return {
        ingredientId: di.ingredient.id,
        name: di.ingredient.name,
        unit: di.ingredient.unit,
        quantityPerPerson: di.quantityPerPerson,
        required,
        currentStock: current,
        shortage,
        remainingStock: remaining,
        isShortage: shortage > 0,
        isLowStockAlert: willBeLowStock,
      };
    });

    const hasShortage = calculations.some((c) => c.isShortage);

    res.json({
      dishId: dish.id,
      dishName: dish.name,
      peopleCount: count,
      hasShortage,
      ingredients: calculations,
    });
  } catch (error) {
    console.error('Calculate Cooking Error:', error);
    res.status(500).json({ message: 'Failed to calculate ingredient requirements' });
  }
};

// @desc    Execute cooking: deduct stock, record transactions, log history
// @route   POST /api/cooking/execute
// @access  Private
const executeCooking = async (req, res) => {
  const { dishId, peopleCount } = req.body;

  if (!dishId || !peopleCount) {
    return res.status(400).json({ message: 'Dish ID and People Count are required' });
  }

  const count = parseInt(peopleCount);
  if (isNaN(count) || count < 5) {
    return res.status(400).json({ message: 'People count must be at least 5' });
  }

  try {
    const dish = await prisma.dish.findUnique({
      where: { id: dishId },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!dish) {
      return res.status(404).json({ message: 'Dish not found' });
    }

    if (dish.ingredients.length === 0) {
      return res.status(400).json({ message: 'This dish has no ingredients defined.' });
    }

    // Execute in a database transaction to ensure atomic stock deduction
    const result = await prisma.$transaction(async (tx) => {
      const snapshot = [];

      for (const di of dish.ingredients) {
        const required = (di.quantityPerPerson * count) / 5;
        const currentIng = await tx.ingredient.findUnique({
          where: { id: di.ingredientId },
        });

        const updatedIng = await tx.ingredient.update({
          where: { id: di.ingredientId },
          data: {
            stock: {
              decrement: required,
            },
          },
        });

        // Log stock-out transaction
        await tx.stockTransaction.create({
          data: {
            ingredientId: di.ingredientId,
            quantity: -required,
            type: 'COOKING',
            reason: `Cooking: ${dish.name} for ${count} people`,
            userId: req.user.id,
          },
        });

        snapshot.push({
          ingredientId: di.ingredientId,
          name: di.ingredient.name,
          quantityUsed: required,
          unit: di.ingredient.unit,
          previousStock: currentIng.stock,
          newStock: updatedIng.stock,
        });
      }

      // Create cooking history
      const history = await tx.cookingHistory.create({
        data: {
          dishId: dish.id,
          peopleCount: count,
          userId: req.user.id,
          ingredientsUsed: snapshot,
        },
      });

      return { history, snapshot };
    });

    // Outside transaction, trigger async notification checks
    for (const item of result.snapshot) {
      // Check low stock alert
      await checkAndCreateLowStockNotification(item.ingredientId);

      // Check if negative stock occurred
      if (item.newStock < 0) {
        await createNotification(
          'Insufficient Stock Deficit',
          `Cooking "${dish.name}" for ${count} people caused a stock deficit for "${item.name}". Current stock: ${item.newStock} ${item.unit}.`,
          'INSUFFICIENT_STOCK'
        );
      }
    }

    res.status(201).json({
      message: 'Cooking executed successfully. Stock automatically deducted.',
      history: result.history,
      details: result.snapshot,
    });
  } catch (error) {
    console.error('Execute Cooking Error:', error);
    res.status(500).json({ message: 'Failed to execute cooking operation' });
  }
};

// @desc    Get cooking history
// @route   GET /api/cooking/history
// @access  Private
const getCookingHistory = async (req, res) => {
  try {
    const history = await prisma.cookingHistory.findMany({
      include: {
        dish: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(history);
  } catch (error) {
    console.error('Get Cooking History Error:', error);
    res.status(500).json({ message: 'Failed to fetch cooking history' });
  }
};

module.exports = {
  calculateIngredients,
  executeCooking,
  getCookingHistory,
};
