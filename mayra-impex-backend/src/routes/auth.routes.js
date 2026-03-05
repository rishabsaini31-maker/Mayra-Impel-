const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { verifyToken, verifyAdmin } = require("../middleware/auth.middleware");
const { validate, schemas } = require("../middleware/validate.middleware");
const {
  redisAuthLimiter,
} = require("../middleware/redis-rate-limit.middleware");
const { protectAgainstReplay } = require("../middleware/replay.middleware");

// Public routes
router.post("/register", validate(schemas.register), authController.register);
router.post(
  "/login",
  redisAuthLimiter,
  validate(schemas.login),
  authController.login,
);
router.post(
  "/refresh-token",
  redisAuthLimiter,
  validate(schemas.refreshToken),
  authController.refreshToken,
);
router.post("/logout", verifyToken, authController.logout);

// Protected routes
router.get("/profile", verifyToken, authController.getProfile);
router.put(
  "/profile",
  verifyToken,
  validate(schemas.updateProfile),
  authController.updateProfile,
);

// Admin PIN verification (for session unlock)
router.post(
  "/verify-admin-pin",
  verifyToken,
  verifyAdmin,
  redisAuthLimiter,
  protectAgainstReplay,
  validate(schemas.verifyAdminPin),
  authController.verifyAdminPin,
);

// 2FA/OTP Recovery Routes
router.post(
  "/request-recovery-otp",
  verifyToken,
  redisAuthLimiter,
  protectAgainstReplay,
  authController.requestRecoveryOTP,
);

router.post(
  "/verify-recovery-otp",
  verifyToken,
  redisAuthLimiter,
  protectAgainstReplay,
  validate(schemas.verifyRecoveryOTP),
  authController.verifyRecoveryOTP,
);

router.post(
  "/add-phone-number",
  verifyToken,
  validate(schemas.addPhoneNumber),
  authController.addPhoneNumber,
);

// GDPR Account Deletion Routes
router.post(
  "/request-deletion",
  verifyToken,
  redisAuthLimiter,
  protectAgainstReplay,
  validate(schemas.requestAccountDeletion),
  authController.requestAccountDeletion,
);

router.post(
  "/confirm-deletion",
  verifyToken,
  redisAuthLimiter,
  protectAgainstReplay,
  validate(schemas.confirmAccountDeletion),
  authController.confirmAccountDeletion,
);

router.post(
  "/cancel-deletion",
  verifyToken,
  authController.cancelAccountDeletion,
);

router.get("/deletion-status", verifyToken, authController.getDeletionStatus);

// Admin routes - Get all customers
router.get("/customers", verifyAdmin, authController.getAllCustomers);

// Admin routes - Customer segments
router.get(
  "/customers/segments/all",
  verifyAdmin,
  authController.getCustomerSegments,
);

// Admin routes - Export customers
router.get(
  "/customers/export/csv",
  verifyAdmin,
  authController.exportCustomers,
);

// Admin routes - Bulk update customers
router.patch(
  "/customers/bulk/update",
  verifyAdmin,
  authController.bulkUpdateCustomers,
);

// Admin routes - Block/Unblock customers (must come before :id route)
router.patch("/customers/:id/block", verifyAdmin, authController.blockCustomer);
router.patch(
  "/customers/:id/unblock",
  verifyAdmin,
  authController.unblockCustomer,
);

// Get specific customer by ID (must come after specific routes)
router.get("/customers/:id", verifyAdmin, authController.getCustomerById);

module.exports = router;
