const express = require('express');
const router = express.Router();
const {
  generateAndSaveReport,
  getReportPreview,
  getSavedReports,
  getReportById,
  deleteReport,
} = require('../controllers/reportController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.get('/', getSavedReports);
router.post('/generate', restrictTo('ADMIN', 'STORE_MANAGER', 'KITCHEN_STAFF'), generateAndSaveReport);
router.post('/preview', getReportPreview);
router.get('/:id', getReportById);
router.delete('/:id', restrictTo('ADMIN'), deleteReport);

module.exports = router;
