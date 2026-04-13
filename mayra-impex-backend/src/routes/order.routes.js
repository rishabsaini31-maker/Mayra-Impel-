const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const {
  verifyToken,
  verifyAdmin,
  isCustomer,
} = require("../middleware/auth.middleware");
const { protectAgainstReplay } = require("../middleware/replay.middleware");
const { validate, schemas } = require("../middleware/validate.middleware");

// Customer routes
router.post(
  "/",
  verifyToken,
  isCustomer,
  protectAgainstReplay,
  validate(schemas.placeOrder),
  orderController.placeOrder,
);
router.get("/my-orders", verifyToken, isCustomer, orderController.getMyOrders);

// Admin routes
router.get("/dashboard-stats", verifyAdmin, orderController.getDashboardStats);
router.get(
  "/analytics/detailed",
  verifyAdmin,
  orderController.getDetailedAnalytics,
);
router.get("/export/csv", verifyAdmin, orderController.exportOrders);
router.patch(
  "/bulk/status",
  verifyAdmin,
  protectAgainstReplay,
  orderController.bulkUpdateStatus,
);
router.get("/all", verifyAdmin, (req, res) =>
  orderController.getAllOrders(req, res),
);
router.put(
  "/:id/status",
  verifyAdmin,
  protectAgainstReplay,
  validate(schemas.updateOrderStatus),
  orderController.updateOrderStatus,
);

// Shared routes (both admin and customer)
router.get("/:id", verifyToken, orderController.getOrderById);

module.exports = router;
