const prisma = require('../config/db');

// @desc    Get all dishes
// @route   GET /api/dishes
// @access  Private
const getDishes = async (req, res) => {
  try {
    const dishes = await prisma.dish.findMany({
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json(dishes);
  } catch (error) {
    console.error('Get Dishes Error:', error);
    res.status(500).json({ message: 'Failed to fetch dishes' });
  }
};

// @desc    Get single dish
// @route   GET /api/dishes/:id
// @access  Private
const getDishById = async (req, res) => {
  try {
    const dish = await prisma.dish.findUnique({
      where: { id: req.params.id },
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

    res.json(dish);
  } catch (error) {
    console.error('Get Dish ID Error:', error);
    res.status(500).json({ message: 'Failed to fetch dish details' });
  }
};

// @desc    Create new dish
// @route   POST /api/dishes
// @access  Private
const createDish = async (req, res) => {
  const { name, description, ingredients } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Dish name is required' });
  }

  try {
    // Check if name exists
    const exists = await prisma.dish.findUnique({
      where: { name },
    });

    if (exists) {
      return res.status(400).json({ message: 'A dish with this name already exists' });
    }

    // Use transaction to create dish and associations
    const newDish = await prisma.$transaction(async (tx) => {
      const dish = await tx.dish.create({
        data: {
          name,
          description,
        },
      });

      if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
        await tx.dishIngredient.createMany({
          data: ingredients.map((item) => ({
            dishId: dish.id,
            ingredientId: item.ingredientId,
            quantityPerPerson: parseFloat(item.quantityPerPerson),
          })),
        });
      }

      return dish;
    });

    // Fetch the complete dish with ingredients to return
    const completedDish = await prisma.dish.findUnique({
      where: { id: newDish.id },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    res.status(201).json(completedDish);
  } catch (error) {
    console.error('Create Dish Error:', error);
    res.status(500).json({ message: 'Failed to create dish' });
  }
};

// @desc    Update dish
// @route   PUT /api/dishes/:id
// @access  Private
const updateDish = async (req, res) => {
  const { name, description, ingredients } = req.body;
  const { id } = req.params;

  try {
    const currentDish = await prisma.dish.findUnique({
      where: { id },
    });

    if (!currentDish) {
      return res.status(404).json({ message: 'Dish not found' });
    }

    // Check unique name if updated
    if (name && name !== currentDish.name) {
      const exists = await prisma.dish.findUnique({
        where: { name },
      });
      if (exists) {
        return res.status(400).json({ message: 'A dish with this name already exists' });
      }
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update basic dish info
      await tx.dish.update({
        where: { id },
        data: {
          name: name || currentDish.name,
          description: description !== undefined ? description : currentDish.description,
        },
      });

      // 2. If ingredients provided, update them
      if (ingredients && Array.isArray(ingredients)) {
        // Delete all old links
        await tx.dishIngredient.deleteMany({
          where: { dishId: id },
        });

        // Insert new ones
        if (ingredients.length > 0) {
          await tx.dishIngredient.createMany({
            data: ingredients.map((item) => ({
              dishId: id,
              ingredientId: item.ingredientId,
              quantityPerPerson: parseFloat(item.quantityPerPerson),
            })),
          });
        }
      }
    });

    // Fetch the updated complete dish
    const updatedDish = await prisma.dish.findUnique({
      where: { id },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    res.json(updatedDish);
  } catch (error) {
    console.error('Update Dish Error:', error);
    res.status(500).json({ message: 'Failed to update dish' });
  }
};

// @desc    Delete dish
// @route   DELETE /api/dishes/:id
// @access  Private
const deleteDish = async (req, res) => {
  try {
    const exists = await prisma.dish.findUnique({
      where: { id: req.params.id },
    });

    if (!exists) {
      return res.status(404).json({ message: 'Dish not found' });
    }

    await prisma.dish.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Dish deleted successfully' });
  } catch (error) {
    console.error('Delete Dish Error:', error);
    res.status(500).json({ message: 'Failed to delete dish' });
  }
};

module.exports = {
  getDishes,
  getDishById,
  createDish,
  updateDish,
  deleteDish,
};
