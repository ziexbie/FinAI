const express = require("express");
const multer = require("multer");
const { protect } = require("../middleware/authMiddleware");
const {
  addFinancialData,
  uploadTransactionsCsv,
  getFinancialDataByUser,
  getFinancialAnalytics,
  getFinancialPredictions,
  getFinancialRecommendations,
  calculateRiskScoreFromPayload,
  analyzeFinance,
} = require("../controllers/financeController");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_, file, callback) => {
    const isCsv = file.mimetype === "text/csv" || file.originalname.toLowerCase().endsWith(".csv");
    callback(isCsv ? null : new Error("Only CSV files are allowed."), isCsv);
  },
});
const uploadCsvFile = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    return next();
  });
};

// Every finance route requires a valid JWT before it reaches the controller.
router.post("/add", protect, addFinancialData);
router.post("/upload-csv", protect, uploadCsvFile, uploadTransactionsCsv);
router.post("/analyze", protect, analyzeFinance);
router.post("/risk-score", protect, calculateRiskScoreFromPayload);
router.get("/analytics/:id", protect, getFinancialAnalytics);
router.get("/history/:id", protect, getFinancialDataByUser);
router.get("/predictions/:id", protect, getFinancialPredictions);
router.get("/recommendations/:id", protect, getFinancialRecommendations);
router.get("/user/:id", protect, getFinancialDataByUser);

module.exports = router;
