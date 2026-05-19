const prisma = require('../config/db');
const { checkAndCreateLowStockNotification } = require('../services/notificationService');

// @desc    Get all ingredients (with search, filter, and sorting)
// @route   GET /api/ingredients
// @access  Private
const getIngredients = async (req, res) => {
  const { search, status, sortBy = 'name', sortOrder = 'asc' } = req.query;

  try {
    // Fetch all matching by search query, then apply in-memory status filter
    // (Prisma doesn't support column-to-column comparisons in a simple where clause)
    const ingredients = await prisma.ingredient.findMany({
      where: search ? { name: { contains: search, mode: 'insensitive' } } : {},
      orderBy: { [sortBy]: sortOrder },
    });

    let filteredIngredients = ingredients;

    if (status) {
      if (status === 'low') {
        filteredIngredients = ingredients.filter(ing => ing.stock < ing.minStock && ing.stock > 0);
      } else if (status === 'out') {
        filteredIngredients = ingredients.filter(ing => ing.stock <= 0);
      } else if (status === 'ok') {
        filteredIngredients = ingredients.filter(ing => ing.stock >= ing.minStock);
      }
    }

    res.json(filteredIngredients);
  } catch (error) {
    console.error('Get Ingredients Error:', error);
    res.status(500).json({ message: 'Failed to fetch ingredients' });
  }
};

// @desc    Get single ingredient
// @route   GET /api/ingredients/:id
// @access  Private
const getIngredientById = async (req, res) => {
  try {
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: req.params.id },
    });

    if (!ingredient) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }

    res.json(ingredient);
  } catch (error) {
    console.error('Get Ingredient ID Error:', error);
    res.status(500).json({ message: 'Failed to fetch ingredient details' });
  }
};

// @desc    Create new ingredient
// @route   POST /api/ingredients
// @access  Private
const createIngredient = async (req, res) => {
  const { name, stock, unit, minStock } = req.body;

  if (!name || !unit) {
    return res.status(400).json({ message: 'Name and Unit are required fields' });
  }

  try {
    // Check uniqueness
    const exists = await prisma.ingredient.findUnique({
      where: { name },
    });

    if (exists) {
      return res.status(400).json({ message: 'An ingredient with this name already exists' });
    }

    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        stock: stock ? parseFloat(stock) : 0,
        unit,
        minStock: minStock ? parseFloat(minStock) : 0,
      },
    });

    // Write a stock-in transaction if stock > 0
    if (stock && parseFloat(stock) > 0) {
      await prisma.stockTransaction.create({
        data: {
          ingredientId: ingredient.id,
          quantity: parseFloat(stock),
          type: 'STOCK_IN',
          reason: 'Initial stock addition upon registration',
          userId: req.user.id,
        },
      });
    }

    // Check low stock alert
    await checkAndCreateLowStockNotification(ingredient.id);

    res.status(201).json(ingredient);
  } catch (error) {
    console.error('Create Ingredient Error:', error);
    res.status(500).json({ message: 'Failed to create ingredient' });
  }
};

// @desc    Update ingredient
// @route   PUT /api/ingredients/:id
// @access  Private
const updateIngredient = async (req, res) => {
  const { name, stock, unit, minStock } = req.body;

  try {
    // Check if ingredient exists
    const currentIng = await prisma.ingredient.findUnique({
      where: { id: req.params.id },
    });

    if (!currentIng) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }

    // If changing name, check uniqueness
    if (name && name !== currentIng.name) {
      const exists = await prisma.ingredient.findUnique({
        where: { name },
      });
      if (exists) {
        return res.status(400).json({ message: 'An ingredient with this name already exists' });
      }
    }

    // Update
    const updatedIngredient = await prisma.ingredient.update({
      where: { id: req.params.id },
      data: {
        name: name || currentIng.name,
        unit: unit || currentIng.unit,
        minStock: minStock !== undefined ? parseFloat(minStock) : currentIng.minStock,
        // We shouldn't directly modify the stock here if we want strict audit logs,
        // but let's allow it, and if it changes, we log a transaction!
        stock: stock !== undefined ? parseFloat(stock) : currentIng.stock,
      },
    });

    // If stock was directly updated, create transaction audit
    if (stock !== undefined && parseFloat(stock) !== currentIng.stock) {
      const diff = parseFloat(stock) - currentIng.stock;
      await prisma.stockTransaction.create({
        data: {
          ingredientId: updatedIngredient.id,
          quantity: diff,
          type: diff > 0 ? 'STOCK_IN' : 'STOCK_OUT',
          reason: `Manual inventory update: changed from ${currentIng.stock} to ${stock}`,
          userId: req.user.id,
        },
      });
    }

    // Check low stock alert
    await checkAndCreateLowStockNotification(updatedIngredient.id);

    res.json(updatedIngredient);
  } catch (error) {
    console.error('Update Ingredient Error:', error);
    res.status(500).json({ message: 'Failed to update ingredient' });
  }
};

// @desc    Delete ingredient
// @route   DELETE /api/ingredients/:id
// @access  Private
const deleteIngredient = async (req, res) => {
  try {
    const exists = await prisma.ingredient.findUnique({
      where: { id: req.params.id },
    });

    if (!exists) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }

    await prisma.ingredient.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Ingredient deleted successfully' });
  } catch (error) {
    console.error('Delete Ingredient Error:', error);
    res.status(500).json({ message: 'Failed to delete ingredient. It may be linked to some dishes.' });
  }
};

module.exports = {
  getIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  deleteIngredient,
};
