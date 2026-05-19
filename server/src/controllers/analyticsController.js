const prisma = require('../config/db');

// @desc    Get dashboard analytics datasets
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboardAnalytics = async (req, res) => {
  try {
    // 1. Fetch general counts (KPI Cards)
    const totalIngredients = await prisma.ingredient.count();
    const totalDishes = await prisma.dish.count();
    const totalTransactions = await prisma.stockTransaction.count();
    
    const cookingStats = await prisma.cookingHistory.aggregate({
      _sum: {
        peopleCount: true,
      },
      _count: {
        id: true,
      },
    });
    
    const totalPeopleServed = cookingStats._sum.peopleCount || 0;
    const totalCookingSessions = cookingStats._count.id || 0;

    // 2. Low stock ingredients list
    const ingredients = await prisma.ingredient.findMany();
    const lowStockList = ingredients
      .filter((ing) => ing.stock < ing.minStock)
      .map((ing) => ({
        id: ing.id,
        name: ing.name,
        stock: ing.stock,
        minStock: ing.minStock,
        unit: ing.unit,
        deficit: ing.minStock - ing.stock,
      }));

    // 3. Cooking history for people served trend (Last 30 days)
    const cookingHistory = await prisma.cookingHistory.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // last 30 days
        },
      },
      include: {
        dish: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group peopleCount by date
    const dateTrendMap = {};
    cookingHistory.forEach((h) => {
      const dateStr = h.createdAt.toISOString().split('T')[0];
      if (!dateTrendMap[dateStr]) {
        dateTrendMap[dateStr] = { date: dateStr, peopleServed: 0, sessions: 0 };
      }
      dateTrendMap[dateStr].peopleServed += h.peopleCount;
      dateTrendMap[dateStr].sessions += 1;
    });
    const peopleTrend = Object.values(dateTrendMap);

    // 4. Dish popularity (Total people served per dish or cook frequency)
    const dishPopularityMap = {};
    cookingHistory.forEach((h) => {
      const dishName = h.dish.name;
      if (!dishPopularityMap[dishName]) {
        dishPopularityMap[dishName] = { name: dishName, value: 0, count: 0 };
      }
      dishPopularityMap[dishName].value += h.peopleCount;
      dishPopularityMap[dishName].count += 1;
    });
    const dishPopularity = Object.values(dishPopularityMap)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 dishes

    // 5. Stock transactions (Last 30 days) for monthly/daily transaction analysis
    const transactions = await prisma.stockTransaction.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        ingredient: true,
      },
    });

    // Ingredient usage (Total quantity consumed in COOKING or STOCK_OUT)
    const usageMap = {};
    transactions.forEach((t) => {
      if (t.type === 'COOKING' || t.type === 'STOCK_OUT' || t.type === 'WASTAGE') {
        const name = `${t.ingredient.name} (${t.ingredient.unit})`;
        const amount = Math.abs(t.quantity);
        if (!usageMap[name]) {
          usageMap[name] = { name, quantity: 0 };
        }
        usageMap[name].quantity += amount;
      }
    });
    const ingredientUsage = Object.values(usageMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10); // Top 10 ingredients used

    // Monthly Transaction Breakdown
    // For simulation, let's group by transaction type (STOCK_IN vs STOCK_OUT + COOKING + WASTAGE)
    const monthlySummaryMap = {
      'STOCK_IN': { name: 'Stock In', value: 0 },
      'STOCK_OUT': { name: 'Stock Out (Manual)', value: 0 },
      'COOKING': { name: 'Cooking Deductions', value: 0 },
      'WASTAGE': { name: 'Wastage', value: 0 },
    };
    
    transactions.forEach((t) => {
      if (monthlySummaryMap[t.type]) {
        monthlySummaryMap[t.type].value += Math.abs(t.quantity);
      }
    });
    const transactionTypeBreakdown = Object.values(monthlySummaryMap);

    // Simulated expense trends based on STOCK_IN (quantity * estimated rates for a clean look)
    // We assign a pseudo-price per unit to show realistic looking expenses
    const pseudoPrices = {
      'kg': 40,
      'g': 0.1,
      'L': 100,
      'ml': 0.15,
      'pcs': 12,
      'packet': 30,
    };

    let totalExpense = 0;
    const weeklyExpenseMap = {};
    
    // Aggregate estimated expense
    transactions.forEach((t) => {
      if (t.type === 'STOCK_IN') {
        const unit = t.ingredient.unit.toLowerCase();
        const pricePerUnit = pseudoPrices[unit] || 25; // default rate
        const cost = Math.abs(t.quantity) * pricePerUnit;
        totalExpense += cost;

        // Group by week
        const date = new Date(t.createdAt);
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'short' });
        const weekLabel = `${month} ${Math.ceil(day / 7)}`;

        if (!weeklyExpenseMap[weekLabel]) {
          weeklyExpenseMap[weekLabel] = { name: weekLabel, expense: 0 };
        }
        weeklyExpenseMap[weekLabel].expense += cost;
      }
    });

    const expenseTrend = Object.values(weeklyExpenseMap);

    res.json({
      summary: {
        totalIngredients,
        totalDishes,
        totalTransactions,
        totalPeopleServed,
        totalCookingSessions,
        totalExpense: Math.round(totalExpense),
        lowStockCount: lowStockList.length,
      },
      lowStockList,
      peopleTrend,
      dishPopularity,
      ingredientUsage,
      transactionTypeBreakdown,
      expenseTrend,
    });
  } catch (error) {
    console.error('Get Analytics Error:', error);
    res.status(500).json({ message: 'Failed to generate analytics datasets' });
  }
};

module.exports = {
  getDashboardAnalytics,
};
