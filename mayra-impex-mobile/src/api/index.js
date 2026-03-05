import api from "./client";

// Authentication APIs
export const authAPI = {
  register: async (data) => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  login: async (data) => {
    const response = await api.post("/auth/login", data);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/auth/profile");
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put("/auth/profile", data);
    return response.data;
  },
};

// Category APIs
export const categoryAPI = {
  getAll: async () => {
    const response = await api.get("/categories");
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/categories", data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};

// Product APIs
export const productAPI = {
  getAll: async (params = {}) => {
    const response = await api.get("/products", { params });
    // Ensure we always return the products array and pagination
    return {
      products: response.data.products || [],
      pagination: response.data.pagination,
    };
  },

  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/products", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  uploadImage: async (formData) => {
    const response = await api.post("/products/upload-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  exportProducts: async (params = {}) => {
    const response = await api.get("/products/export/csv", { params });
    return response.data;
  },
};

// Order APIs
export const orderAPI = {
  placeOrder: async (data) => {
    const response = await api.post("/orders", data);
    return response.data;
  },

  getMyOrders: async (params = {}) => {
    const response = await api.get("/orders/my-orders", { params });
    return response.data;
  },

  getAllOrders: async (params = {}) => {
    const response = await api.get("/orders/all", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.put(`/orders/${id}/status`, { status });
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await api.get("/orders/dashboard-stats");
    return response.data;
  },

  // New features
  getDetailedAnalytics: async () => {
    const response = await api.get("/orders/analytics/detailed");
    return response.data;
  },

  exportOrders: async (params = {}) => {
    const response = await api.get("/orders/export/csv", { params });
    return response.data;
  },

  bulkUpdateStatus: async (data) => {
    const response = await api.patch("/orders/bulk/status", data);
    return response.data;
  },
};

// User/Customer APIs
export const userAPI = {
  getAllCustomers: async (params = {}) => {
    const response = await api.get("/auth/customers", { params });
    return response.data;
  },

  getCustomerById: async (id) => {
    const response = await api.get(`/auth/customers/${id}`);
    return response.data;
  },

  blockCustomer: async (id) => {
    const response = await api.patch(`/auth/customers/${id}/block`);
    return response.data;
  },

  unblockCustomer: async (id) => {
    const response = await api.patch(`/auth/customers/${id}/unblock`);
    return response.data;
  },

  // New features
  getCustomerSegments: async () => {
    const response = await api.get("/auth/customers/segments/all");
    return response.data;
  },

  exportCustomers: async (params = {}) => {
    const response = await api.get("/auth/customers/export/csv", { params });
    return response.data;
  },

  bulkUpdateCustomers: async (data) => {
    const response = await api.patch("/auth/customers/bulk/update", data);
    return response.data;
  },
};

// Activity Log APIs
export const activityAPI = {
  logActivity: async (data) => {
    const response = await api.post("/activity", data);
    return response.data;
  },

  getActivityLogs: async (params = {}) => {
    const response = await api.get("/activity", { params });
    return response.data;
  },
};

// Customer Notes APIs
export const notesAPI = {
  addNote: async (data) => {
    const response = await api.post("/notes", data);
    return response.data;
  },

  getNotes: async (customerId) => {
    const response = await api.get(`/notes/${customerId}`);
    return response.data;
  },

  deleteNote: async (noteId) => {
    const response = await api.delete(`/notes/${noteId}`);
    return response.data;
  },
};

// Inventory APIs
export const inventoryAPI = {
  updateQuantity: async (data) => {
    const response = await api.post("/inventory/update", data);
    return response.data;
  },

  adjustInventory: async (data) => {
    const response = await api.patch("/inventory/adjust", data);
    return response.data;
  },

  bulkUpdateInventory: async (data) => {
    const response = await api.patch("/inventory/bulk", data);
    return response.data;
  },

  getAllInventory: async (params = {}) => {
    const response = await api.get("/inventory", { params });
    return response.data;
  },

  getInventory: async (productId) => {
    const response = await api.get(`/inventory/${productId}`);
    return response.data;
  },
};

// Home Banner APIs
export const bannerAPI = {
  getAll: async () => {
    const response = await api.get("/banners");
    return response.data;
  },

  getAdminAll: async () => {
    const response = await api.get("/banners/admin/all");
    return response.data;
  },

  uploadImage: async (formData) => {
    const response = await api.post("/banners/upload-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/banners", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/banners/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/banners/${id}`);
    return response.data;
  },
};
