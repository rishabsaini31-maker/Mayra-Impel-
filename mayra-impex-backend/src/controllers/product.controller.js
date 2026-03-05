const { supabase } = require("../config/supabase");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const emailService = require("../services/email.service");

// Configure multer for image upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed"));
  },
});

const normalizeSerialNumber = (serialNumber) => {
  if (typeof serialNumber !== "string") return null;
  const normalized = serialNumber.trim();
  return normalized || null;
};

const isMissingSerialNumberColumn = (error) => {
  const message = error?.message || "";
  return (
    error?.code === "42703" ||
    /serial_number|column .*serial_number.*does not exist/i.test(message)
  );
};

class ProductController {
  // Get all products with pagination and filters
  async getAllProducts(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        category_id,
        is_active,
        search,
      } = req.query;

      const offset = (page - 1) * limit;

      let query = supabase.from("products").select(
        `
          *,
          categories (
            id,
            name
          )
        `,
        { count: "exact" },
      );

      // Apply filters
      if (category_id) {
        query = query.eq("category_id", category_id);
      }

      if (is_active !== undefined) {
        query = query.eq("is_active", is_active === "true");
      }

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      // Pagination
      query = query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: products, error, count } = await query;

      if (error) throw error;

      res.status(200).json({
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  }

  // Get single product by ID
  async getProductById(req, res) {
    try {
      const { id } = req.params;

      const { data: product, error } = await supabase
        .from("products")
        .select(
          `
          *,
          categories (
            id,
            name
          )
        `,
        )
        .eq("id", id)
        .is("deleted_at", null)
        .single();

      if (error || !product) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.status(200).json({ product });
    } catch (error) {
      console.error("Get product error:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  }

  // Create product (Admin only)
  async createProduct(req, res) {
    try {
      const {
        name,
        description,
        price,
        category_id,
        image_url,
        is_active,
        serial_number,
      } = req.body;
      const normalizedSerial = normalizeSerialNumber(serial_number);
      let supportsSerialNumber = true;

      if (normalizedSerial) {
        const { data: existingProduct, error: existingError } = await supabase
          .from("products")
          .select("id")
          .ilike("serial_number", normalizedSerial)
          .limit(1);

        if (existingError) {
          if (isMissingSerialNumberColumn(existingError)) {
            supportsSerialNumber = false;
          } else {
            throw existingError;
          }
        }

        if (supportsSerialNumber && existingProduct?.length) {
          return res.status(409).json({
            error: "SKU already exists. Please use a unique serial number.",
          });
        }
      }

      const insertPayload = {
        name,
        description,
        price,
        category_id,
        image_url: image_url || null,
        is_active: is_active !== undefined ? is_active : true,
      };

      if (supportsSerialNumber) {
        insertPayload.serial_number = normalizedSerial;
      }

      let { data: product, error } = await supabase
        .from("products")
        .insert(insertPayload)
        .select(
          `
          *,
          categories (
            id,
            name
          )
        `,
        )
        .single();

      if (error && supportsSerialNumber && isMissingSerialNumberColumn(error)) {
        const fallbackPayload = { ...insertPayload };
        delete fallbackPayload.serial_number;

        const fallbackResult = await supabase
          .from("products")
          .insert(fallbackPayload)
          .select(
            `
            *,
            categories (
              id,
              name
            )
          `,
          )
          .single();

        product = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (error) throw error;

      res.status(201).json({
        message: "Product created successfully",
        product,
      });
    } catch (error) {
      console.error("Create product error:", error);
      if (error?.code === "23505") {
        return res.status(409).json({
          error: "SKU already exists. Please use a unique serial number.",
        });
      }
      res.status(500).json({ error: "Failed to create product" });
    }
  }

  // Update product (Admin only)
  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const updates = { ...req.body };
      let supportsSerialNumber = true;

      if (Object.prototype.hasOwnProperty.call(updates, "serial_number")) {
        const normalizedSerial = normalizeSerialNumber(updates.serial_number);
        updates.serial_number = normalizedSerial;

        if (normalizedSerial) {
          const { data: existingProduct, error: existingError } = await supabase
            .from("products")
            .select("id")
            .ilike("serial_number", normalizedSerial)
            .neq("id", id)
            .limit(1);

          if (existingError) {
            if (isMissingSerialNumberColumn(existingError)) {
              supportsSerialNumber = false;
            } else {
              throw existingError;
            }
          }

          if (supportsSerialNumber && existingProduct?.length) {
            return res.status(409).json({
              error: "SKU already exists. Please use a unique serial number.",
            });
          }
        }

        if (!supportsSerialNumber) {
          delete updates.serial_number;
        }
      }

      let { data: product, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select(
          `
          *,
          categories (
            id,
            name
          )
        `,
        )
        .single();

      if (error && isMissingSerialNumberColumn(error)) {
        const fallbackUpdates = { ...updates };
        delete fallbackUpdates.serial_number;

        const fallbackResult = await supabase
          .from("products")
          .update(fallbackUpdates)
          .eq("id", id)
          .select(
            `
            *,
            categories (
              id,
              name
            )
          `,
          )
          .single();

        product = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (error) {
        if (error.code === "PGRST116") {
          return res.status(404).json({ error: "Product not found" });
        }
        throw error;
      }

      res.status(200).json({
        message: "Product updated successfully",
        product,
      });
    } catch (error) {
      console.error("Update product error:", error);
      if (error?.code === "23505") {
        return res.status(409).json({
          error: "SKU already exists. Please use a unique serial number.",
        });
      }
      res.status(500).json({ error: "Failed to update product" });
    }
  }

  // Export products as CSV
  async exportProducts(req, res) {
    try {
      let { data: products, error } = await supabase
        .from("products")
        .select(
          `
            id,
            name,
            serial_number,
            description,
            price,
            is_active,
            created_at,
            categories(name)
          `,
        )
        .order("created_at", { ascending: false });

      if (error && isMissingSerialNumberColumn(error)) {
        const fallbackResult = await supabase
          .from("products")
          .select(
            `
              id,
              name,
              description,
              price,
              is_active,
              created_at,
              categories(name)
            `,
          )
          .order("created_at", { ascending: false });

        products = (fallbackResult.data || []).map((product) => ({
          ...product,
          serial_number: "",
        }));
        error = fallbackResult.error;
      }

      if (error) throw error;

      const headers = [
        "Product ID",
        "Name",
        "SKU",
        "Category",
        "Price",
        "Status",
        "Created Date",
      ];

      const rows = (products || []).map((product) => [
        product.id,
        product.name,
        product.serial_number || "",
        product.categories?.name || "Uncategorized",
        product.price,
        product.is_active ? "Active" : "Inactive",
        new Date(product.created_at).toLocaleDateString("en-IN"),
      ]);

      const csv = [headers, ...rows]
        .map((row) =>
          row
            .map((value) => {
              const safeValue = value ?? "";
              const valueString = String(safeValue);
              return valueString.includes(",")
                ? `"${valueString}"`
                : valueString;
            })
            .join(","),
        )
        .join("\n");

      const fileName = `products_export_${Date.now()}.csv`;

      let emailSent = false;
      let emailWarning = null;

      try {
        await emailService.sendCSVExportEmail({
          exportType: "Products",
          fileName,
          csvContent: csv,
          requestedBy: { email: req.user?.email },
        });
        emailSent = true;
      } catch (mailError) {
        emailWarning = mailError.message;
      }

      res.status(200).json({
        message: "Products exported",
        csv,
        fileName,
        emailSent,
        emailWarning,
      });
    } catch (error) {
      console.error("Export products error:", error);
      res.status(500).json({ error: "Failed to export products" });
    }
  }

  // Delete product (Admin only)
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;

      // Check if product exists in any orders
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("id")
        .eq("product_id", id)
        .limit(1);

      if (orderItems && orderItems.length > 0) {
        return res.status(400).json({
          error:
            "Cannot delete product with existing orders. Consider deactivating instead.",
        });
      }

      const { error } = await supabase
        .from("products")
        .update({
          is_active: false,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", id)
        .is("deleted_at", null);

      if (error) throw error;

      res.status(200).json({ message: "Product archived successfully" });
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  }

  // Upload product image (Admin only)
  async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const fileName = `product-${Date.now()}-${req.file.originalname}`;
      const filePath = `products/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("product-images")
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(filePath);

      res.status(200).json({
        message: "Image uploaded successfully",
        image_url: publicUrl,
      });
    } catch (error) {
      console.error("Upload image error:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  }

  // Get upload middleware
  getUploadMiddleware() {
    return upload.single("image");
  }
}

module.exports = new ProductController();
