const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { verifyToken, verifyAdmin } = require("../middleware/auth.middleware");

// All these routes are under /api/customers (as a separate namespace from /api/auth/customers)

// Admin routes - Get all customers
router.get("/", verifyAdmin, authController.getAllCustomers);

// Admin routes - Customer segments
router.get("/segments/all", verifyAdmin, authController.getCustomerSegments);

// Admin routes - Export customers
router.get("/export/csv", verifyAdmin, authController.exportCustomers);

// Admin routes - Bulk update customers
router.patch("/bulk/update", verifyAdmin, authController.bulkUpdateCustomers);

// Admin routes - Block/Unblock customers (must come before :id route)
router.patch("/:id/block", verifyAdmin, authController.blockCustomer);
router.patch("/:id/unblock", verifyAdmin, authController.unblockCustomer);

// Get specific customer by ID (must come after specific routes)
router.get("/:id", verifyAdmin, authController.getCustomerById);

module.exports = router;
