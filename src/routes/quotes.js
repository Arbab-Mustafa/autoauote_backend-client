require("dotenv").config();
const logger = require("../logger");
const express = require("express");
const router = express.Router();
const { validateQuoteRequest } = require("../middleware/validation");
const QuoteController = require("../controllers/quoteController");

/**
 * @route GET /api/quotes
 * @description Test endpoint - returns available products
 * @access Public
 */
router.get("/", (req, res) => {
  res.status(200).json({
    message: "Auto Quote API is running",
    endpoints: {
      "GET /api/quotes": "This endpoint (returns available products)",
      "POST /api/quotes": "Get quotes for a vehicle",
      "GET /api/quotes/vehicle/:vin": "Get vehicle details from VIN",
      "GET /api/quotes/products": "Get available product types",
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route POST /api/quotes
 * @description Get quotes for a vehicle
 * @access Public
 */
router.post("/", validateQuoteRequest, QuoteController.getQuotes);

/**
 * @route GET /api/quotes/vehicle/:vin
 * @description Get vehicle details from VIN
 * @access Public
 */
router.get("/vehicle/:vin", QuoteController.getVehicleDetails);

/**
 * @route GET /api/quotes/products
 * @description Get available product types
 * @access Public
 */
router.get("/products", QuoteController.getAvailableProducts);

module.exports = router;
