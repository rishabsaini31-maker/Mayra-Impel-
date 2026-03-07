require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const logger = require("./src/utils/logger");
// const Sentry = require("@sentry/node");
const cors = require("cors");
const { validateEnv } = require("./src/utils/env");
const {
  sanitizeRequest,
  requestLogger,
} = require("./src/middleware/security.middleware");
const {
  redisApiLimiter,
  redisAdminWriteLimiter,
} = require("./src/middleware/redis-rate-limit.middleware");
const {
  notFoundHandler,
  errorHandler,
} = require("./src/middleware/error.middleware");
const { connectRedis } = require("./src/config/redis");

// Import routes
const authRoutes = require("./src/routes/auth.routes");
const productRoutes = require("./src/routes/product.routes");
const categoryRoutes = require("./src/routes/category.routes");
const orderRoutes = require("./src/routes/order.routes");
const activityRoutes = require("./src/routes/activity.routes");
const notesRoutes = require("./src/routes/notes.routes");
const inventoryRoutes = require("./src/routes/inventory.routes");
const bannerRoutes = require("./src/routes/banner.routes");
const customersRoutes = require("./src/routes/customers.routes");

// Sentry integration skipped for now

const app = express();
const PORT = process.env.PORT || 5000;

validateEnv();

// Sentry request handler skipped

app.disable("x-powered-by");
app.set("trust proxy", 1);

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: "no-referrer" },
  }),
);

const trustedOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowAllInDev = process.env.NODE_ENV !== "production";

if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    const proto = req.headers["x-forwarded-proto"];
    if (proto && proto !== "https") {
      return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
    }
    return next();
  });
}

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowAllInDev || trustedOrigins.includes(origin)) {
        return callback(null, true);
      }

      const swaggerUi = require("swagger-ui-express");
      const swaggerJsdoc = require("swagger-jsdoc");
      return callback(new Error("CORS policy violation"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-client-timestamp",
      "x-client-nonce",
      "x-request-id",
    ],
  }),
);

// Body parser
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true }));

app.use(requestLogger);
app.use(sanitizeRequest);

// Rate limiting
app.use("/api/", redisApiLimiter);

// Health check
app.get("/health", (req, res) => {
  logger.info("/health endpoint hit");
  res.status(200).json({
    status: "OK",
    message: "Mayra Impex API is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/products", redisAdminWriteLimiter, productRoutes);
app.use("/api/categories", redisAdminWriteLimiter, categoryRoutes);
app.use("/api/orders", redisAdminWriteLimiter, orderRoutes);
app.use("/api/activity", redisAdminWriteLimiter, activityRoutes);
app.use("/api/notes", redisAdminWriteLimiter, notesRoutes);
app.use("/api/inventory", redisAdminWriteLimiter, inventoryRoutes);
app.use("/api/banners", redisAdminWriteLimiter, bannerRoutes);

// 404 handler
app.use(notFoundHandler);

// Sentry error handler skipped

// Global error handler
app.use(errorHandler);

process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled promise rejection: ${reason}`);
});

process.on("uncaughtException", (error) => {
  logger.error(`Uncaught exception: ${error}`);
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    await connectRedis();

    logger.info("About to start server...");
    app.listen(PORT, "0.0.0.0", () => {
      logger.info(
        `🚀 Mayra Impex API Server running on port ${PORT} (0.0.0.0)`,
      );
      logger.info(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(
        `🔒 Trusted CORS origins: ${trustedOrigins.join(", ") || "none"}`,
      );
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

module.exports = app;
