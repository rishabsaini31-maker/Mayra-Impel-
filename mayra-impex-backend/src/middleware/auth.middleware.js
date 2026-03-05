const { supabase } = require("../config/supabase");
const { verifyAccessToken } = require("../utils/jwt-keyring");

const extractBearerToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
};

// Verify JWT token
const verifyToken = (req, res, next) => {
  try {
    const token = extractBearerToken(req);

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded; // { userId, email, role }
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
};

const requireRole = (role) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.user.role !== role) {
    return res.status(403).json({ error: `${role} access required` });
  }

  next();
};

// Check if user is admin
const isAdmin = requireRole("admin");

const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, (verifyError) => {
    if (verifyError) return next(verifyError);

    isAdmin(req, res, async (roleError) => {
      if (roleError) return next(roleError);

      try {
        const { data: currentUser, error } = await supabase
          .from("users")
          .select("id, role, is_blocked, deleted_at, token_version")
          .eq("id", req.user.userId)
          .maybeSingle();

        const message = error?.message || "";
        const missingColumns =
          error?.code === "42703" ||
          /is_blocked|deleted_at|token_version/i.test(message);

        if (error && !missingColumns) throw error;

        if (error && missingColumns) {
          const fallback = await supabase
            .from("users")
            .select("id, role")
            .eq("id", req.user.userId)
            .maybeSingle();

          if (fallback.error || !fallback.data) {
            return res.status(401).json({ error: "User not found" });
          }

          if (fallback.data.role !== "admin") {
            return res.status(403).json({ error: "Admin access required" });
          }

          return next();
        }

        if (!currentUser) {
          return res.status(401).json({ error: "User not found" });
        }

        if (currentUser.role !== "admin") {
          return res.status(403).json({ error: "Admin access required" });
        }

        if (currentUser.is_blocked || currentUser.deleted_at) {
          return res
            .status(403)
            .json({ error: "Admin account is inactive or blocked" });
        }

        const tokenVersion = Number(req.user.tv || 0);
        const userTokenVersion = Number(currentUser.token_version || 0);
        if (tokenVersion !== userTokenVersion) {
          return res.status(401).json({ error: "Token has been revoked" });
        }

        return next();
      } catch (error) {
        return res
          .status(500)
          .json({ error: "Authorization verification failed" });
      }
    });
  });
};

// Check if user is customer
const isCustomer = requireRole("customer");

module.exports = {
  verifyToken,
  isAdmin,
  isCustomer,
  verifyAdmin,
  requireRole,
};
