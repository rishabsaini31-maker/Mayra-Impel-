import api from "./client";

export const uploadAPI = {
  uploadImage: async (formData, folder = "products") => {
    formData.append("folder", folder);

    // Update endpoint to use /api/upload-image
    const response = await api.post("/api/upload-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  deleteImage: async (publicId) => {
    // Update endpoint to use /api/delete-image
    const response = await api.delete("/api/delete-image", {
      data: {
        public_id: publicId,
      },
    });

    return response.data;
  },
};

// Authentication APIs
export const authAPI = {
  register: async (data) => {
    const response = await api.post("/api/auth/register", data);
    return response.data;
  },

  login: async (data) => {
    const response = await api.post("/api/auth/login", data);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/api/auth/profile");
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put("/api/auth/profile", data);
    return response.data;
  },
};

// Category APIs
export const categoryAPI = {
  getAll: async () => {
    const response = await api.get("/api/categories");
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/api/categories", data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/categories/${id}`);
    return response.data;
  },
};

// Product APIs
export const productAPI = {
  getAll: async (params = {}) => {
    const response = await api.get("/api/products", { params });
    // Ensure we always return the products array and pagination
    return {
      products: response.data.products || [],
      pagination: response.data.pagination,
    };
  },

  getById: async (id) => {
    const response = await api.get(`/api/products/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/api/products", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/api/products/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/products/${id}`);
    return response.data;
  },

  uploadImage: async (formData) => {
    return uploadAPI.uploadImage(formData, "products");
  },

  exportProducts: async (params = {}) => {
    const response = await api.get("/api/products/export/csv", { params });
    return response.data;
  },
};

// Order APIs
export const orderAPI = {
  placeOrder: async (data) => {
    const response = await api.post("/api/orders", data);
    return response.data;
  },

  getMyOrders: async (params = {}) => {
    const response = await api.get("/api/orders/my-orders", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/orders/${id}`);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.put(`/api/orders/${id}/status`, { status });
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await api.get("/api/orders/dashboard-stats");
    return response.data;
  },

  getDetailedAnalytics: async () => {
    const response = await api.get("/api/orders/analytics/detailed");
    return response.data;
  },

  exportOrders: async (params = {}) => {
    const response = await api.get("/api/orders/export/csv", { params });
    return response.data;
  },

  bulkUpdateStatus: async (data) => {
    const response = await api.patch("/api/orders/bulk/status", data);
    return response.data;
  },
};

// User/Customer APIs
export const userAPI = {
  getAllCustomers: async (params = {}) => {
    const response = await api.get("/api/auth/customers", { params });
    return response.data;
  },

  getCustomerById: async (id) => {
    const response = await api.get(`/api/auth/customers/${id}`);
    return response.data;
  },

  blockCustomer: async (id) => {
    const response = await api.patch(`/api/auth/customers/${id}/block`);
    return response.data;
  },

  unblockCustomer: async (id) => {
    const response = await api.patch(`/api/auth/customers/${id}/unblock`);
    return response.data;
  },

  // New features
  getCustomerSegments: async () => {
    const response = await api.get("/api/auth/customers/segments/all");
    return response.data;
  },

  exportCustomers: async (params = {}) => {
    const response = await api.get("/api/auth/customers/export/csv", {
      params,
    });
    return response.data;
  },

  bulkUpdateCustomers: async (data) => {
    const response = await api.patch("/api/auth/customers/bulk/update", data);
    return response.data;
  },
};

// Activity Log APIs
export const activityAPI = {
  logActivity: async (data) => {
    const response = await api.post("/api/activity", data);
    return response.data;
  },

  getActivityLogs: async (params = {}) => {
    const response = await api.get("/api/activity", { params });
    return response.data;
  },
};

// Customer Notes APIs
export const notesAPI = {
  addNote: async (data) => {
    const response = await api.post("/api/notes", data);
    return response.data;
  },

  getNotes: async (customerId) => {
    const response = await api.get(`/api/notes/${customerId}`);
    return response.data;
  },

  deleteNote: async (noteId) => {
    const response = await api.delete(`/api/notes/${noteId}`);
    return response.data;
  },
};

// Inventory APIs
export const inventoryAPI = {
  updateQuantity: async (data) => {
    const response = await api.post("/api/inventory/update", data);
    return response.data;
  },

  adjustInventory: async (data) => {
    const response = await api.patch("/api/inventory/adjust", data);
    return response.data;
  },

  bulkUpdateInventory: async (data) => {
    const response = await api.patch("/api/inventory/bulk", data);
    return response.data;
  },

  getAllInventory: async (params = {}) => {
    const response = await api.get("/api/inventory", { params });
    return response.data;
  },

  getInventory: async (productId) => {
    const response = await api.get(`/api/inventory/${productId}`);
    return response.data;
  },
};

// Home Banner APIs
export const bannerAPI = {
  getAll: async () => {
    const response = await api.get("/api/banners");
    return response.data;
  },

  getAdminAll: async () => {
    const response = await api.get("/api/banners/admin/all");
    return response.data;
  },

  uploadImage: async (formData) => {
    return uploadAPI.uploadImage(formData, "products");
  },

  create: async (data) => {
    const response = await api.post("/api/banners", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/api/banners/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/banners/${id}`);
    return response.data;
  },
};
