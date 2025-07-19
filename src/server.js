require("dotenv").config();
const logger = require("./logger");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

// Import routes
const quoteRoutes = require("./routes/quotes");

// Import middleware
const { errorHandler } = require("./middleware/errorHandler");

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || "*" })); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies
app.use(morgan("dev")); // HTTP request logger

// Apply rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes",
});

// Apply rate limiting to all routes
app.use(apiLimiter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Auto Quote API Server",
    version: "1.0.0",
    endpoints: {
      "GET /": "This endpoint (API information)",
      "GET /health": "Health check",
      "GET /api/quotes": "API information and available endpoints",
      "POST /api/quotes": "Get quotes for a vehicle",
      "GET /api/quotes/vehicle/:vin": "Get vehicle details from VIN",
      "GET /api/quotes/products": "Get available product types",
      "GET /api/kpi-report": "KPI reporting",
    },
    documentation: "http://localhost:3000/api/quotes",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/quotes", quoteRoutes);

// Error handling middleware
const kpiRoutes = require("./routes/kpi");
app.use("/api", kpiRoutes);
app.use(errorHandler);

// Start the server
try {
  app.listen(PORT, () => {
    logger.info(`🚀 Auto Quote API Server running on port ${PORT}`);
    logger.info(`📊 Health check: http://localhost:${PORT}/health`);
    logger.info(`📋 API Documentation: http://localhost:${PORT}/api/quotes`);
    logger.info(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);
  });
} catch (error) {
  logger.error("Failed to start server:", error);
  process.exit(1);
}

module.exports = app; // For testing
