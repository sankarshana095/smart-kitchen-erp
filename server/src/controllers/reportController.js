const prisma = require('../config/db');

// Helper to fetch report data on demand
const compileReportData = async (type, options = {}) => {
  const startDate = options.startDate ? new Date(options.startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
  const endDate = options.endDate ? new Date(options.endDate) : new Date();

  switch (type) {
    case 'DAILY_COOKING': {
      const history = await prisma.cookingHistory.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          dish: true,
          user: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const totalPeople = history.reduce((sum, h) => sum + h.peopleCount, 0);

      return {
        totalSessions: history.length,
        totalPeopleServed: totalPeople,
        sessions: history.map((h) => ({
          id: h.id,
          dishName: h.dish.name,
          peopleCount: h.peopleCount,
          time: h.createdAt,
          user: h.user ? h.user.name : 'Unknown',
          ingredientsUsed: h.ingredientsUsed,
        })),
      };
    }

    case 'INVENTORY': {
      const ingredients = await prisma.ingredient.findMany({
        orderBy: { name: 'asc' },
      });

      const lowStock = ingredients.filter((i) => i.stock < i.minStock);
      const outOfStock = ingredients.filter((i) => i.stock <= 0);

      return {
        totalIngredients: ingredients.length,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        items: ingredients.map((i) => ({
          id: i.id,
          name: i.name,
          stock: i.stock,
          unit: i.unit,
          minStock: i.minStock,
          status: i.stock <= 0 ? 'OUT_OF_STOCK' : i.stock < i.minStock ? 'LOW_STOCK' : 'OK',
        })),
      };
    }

    case 'TRANSACTION': {
      const transactions = await prisma.stockTransaction.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          ingredient: true,
          user: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const inCount = transactions.filter((t) => t.type === 'STOCK_IN').length;
      const outCount = transactions.filter((t) => t.type !== 'STOCK_IN').length;

      return {
        totalTransactions: transactions.length,
        stockInCount: inCount,
        stockOutCount: outCount,
        transactions: transactions.map((t) => ({
          id: t.id,
          ingredientName: t.ingredient.name,
          quantity: t.quantity,
          unit: t.ingredient.unit,
          type: t.type,
          reason: t.reason,
          time: t.createdAt,
          user: t.user ? t.user.name : 'System',
        })),
      };
    }

    case 'USAGE': {
      const transactions = await prisma.stockTransaction.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          type: {
            in: ['COOKING', 'STOCK_OUT', 'WASTAGE'],
          },
        },
        include: {
          ingredient: true,
        },
      });

      // Group usages
      const groups = {};
      transactions.forEach((t) => {
        const key = t.ingredientId;
        if (!groups[key]) {
          groups[key] = {
            ingredientName: t.ingredient.name,
            unit: t.ingredient.unit,
            totalCooking: 0,
            totalStockOut: 0,
            totalWastage: 0,
            totalCombined: 0,
          };
        }

        const absVal = Math.abs(t.quantity);
        if (t.type === 'COOKING') {
          groups[key].totalCooking += absVal;
        } else if (t.type === 'STOCK_OUT') {
          groups[key].totalStockOut += absVal;
        } else if (t.type === 'WASTAGE') {
          groups[key].totalWastage += absVal;
        }
        groups[key].totalCombined += absVal;
      });

      return {
        startDate,
        endDate,
        usages: Object.values(groups),
      };
    }

    default:
      throw new Error('Unsupported report type');
  }
};

// @desc    Generate a saved report
// @route   POST /api/reports/generate
// @access  Private
const generateAndSaveReport = async (req, res) => {
  const { title, type, startDate, endDate } = req.body;

  if (!title || !type) {
    return res.status(400).json({ message: 'Title and Type are required' });
  }

  try {
    const content = await compileReportData(type, { startDate, endDate });

    const report = await prisma.report.create({
      data: {
        title,
        type,
        content: content,
        userId: req.user.id,
      },
      include: {
        user: { select: { name: true } },
      },
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('Generate Report Error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate report' });
  }
};

// @desc    Get report preview on the fly
// @route   POST /api/reports/preview
// @access  Private
const getReportPreview = async (req, res) => {
  const { type, startDate, endDate } = req.body;

  if (!type) {
    return res.status(400).json({ message: 'Report type is required' });
  }

  try {
    const data = await compileReportData(type, { startDate, endDate });
    res.json(data);
  } catch (error) {
    console.error('Preview Report Error:', error);
    res.status(500).json({ message: error.message || 'Failed to compile report data' });
  }
};

// @desc    Get all saved reports
// @route   GET /api/reports
// @access  Private
const getSavedReports = async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reports);
  } catch (error) {
    console.error('Get Saved Reports Error:', error);
    res.status(500).json({ message: 'Failed to fetch saved reports' });
  }
};

// @desc    Get report details
// @route   GET /api/reports/:id
// @access  Private
const getReportById = async (req, res) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { name: true } },
      },
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    console.error('Get Report ID Error:', error);
    res.status(500).json({ message: 'Failed to fetch report details' });
  }
};

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private
const deleteReport = async (req, res) => {
  try {
    const exists = await prisma.report.findUnique({
      where: { id: req.params.id },
    });

    if (!exists) {
      return res.status(404).json({ message: 'Report not found' });
    }

    await prisma.report.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Delete Report Error:', error);
    res.status(500).json({ message: 'Failed to delete report' });
  }
};

module.exports = {
  generateAndSaveReport,
  getReportPreview,
  getSavedReports,
  getReportById,
  deleteReport,
};
