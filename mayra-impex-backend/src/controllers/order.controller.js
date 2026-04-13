const { supabase } = require("../config/supabase");
const pdfService = require("../services/pdf.service");
const emailService = require("../services/email.service");
const whatsappService = require("../services/whatsapp.service");

class OrderController {
  static isMissingSerialNumberColumn(error) {
    const message = error?.message || "";
    return /serial_number|column .*serial_number.*does not exist/i.test(
      message,
    );
  }

  // Place a new order
  async placeOrder(req, res) {
    try {
      const {
        items,
        delivery_name,
        delivery_phone,
        shop_name,
        delivery_address,
      } = req.body;
      const customerId = req.user.userId;

      // Get customer details
      const { data: customer, error: customerError } = await supabase
        .from("users")
        .select("id, name, phone")
        .eq("id", customerId)
        .single();

      if (customerError) throw customerError;

      // Validate all products exist and are active
      const productIds = items.map((item) => item.product_id);
      let { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, name, price, serial_number, is_active")
        .in("id", productIds);

      if (
        productsError &&
        this.constructor.isMissingSerialNumberColumn(productsError)
      ) {
        const fallbackQuery = await supabase
          .from("products")
          .select("id, name, price, is_active")
          .in("id", productIds);

        products = (fallbackQuery.data || []).map((product) => ({
          ...product,
          serial_number: null,
        }));
        productsError = fallbackQuery.error;
      }

      if (productsError) throw productsError;

      if (products.length !== productIds.length) {
        return res
          .status(400)
          .json({ error: "One or more products not found" });
      }

      const inactiveProducts = products.filter((p) => !p.is_active);
      if (inactiveProducts.length > 0) {
        return res.status(400).json({
          error: "Some products are no longer available",
          inactive: inactiveProducts.map((p) => p.name),
        });
      }

      // Create order
      let { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: customerId,
          status: "pending",
          delivery_name: delivery_name || customer.name,
          delivery_phone: delivery_phone || customer.phone,
          shop_name: shop_name,
          delivery_address: delivery_address,
        })
        .select()
        .single();

      if (orderError) {
        const isMissingDeliveryColumns =
          /delivery_name|delivery_phone|shop_name|delivery_address/i.test(
            orderError.message || "",
          );

        if (isMissingDeliveryColumns) {
          const legacyInsert = await supabase
            .from("orders")
            .insert({
              customer_id: customerId,
              status: "pending",
            })
            .select()
            .single();

          order = legacyInsert.data;
          orderError = legacyInsert.error;
        }
      }

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Prepare order details with product info
      const orderDetails = {
        orderId: order.id,
        orderDate: new Date(order.created_at).toLocaleString(),
        customer: {
          name: customer.name,
          phone: customer.phone,
        },
        delivery: {
          name: order.delivery_name || delivery_name || customer.name,
          phone: order.delivery_phone || delivery_phone || customer.phone,
          shopName: order.shop_name || shop_name || "N/A",
          address: order.delivery_address || delivery_address || "N/A",
        },
        items: items.map((item) => {
          const product = products.find((p) => p.id === item.product_id);
          return {
            name: product.name,
            serialNumber: product.serial_number || null,
            quantity: item.quantity,
            price: product.price,
          };
        }),
      };

      let pdfPath = null;
      let pdfUrl = null;
      const warnings = [];

      try {
        console.log("📄 Generating PDF...");
        pdfPath = await pdfService.generateOrderPDF(orderDetails);
      } catch (pdfError) {
        warnings.push(`PDF generation failed: ${pdfError.message}`);
      }

      if (pdfPath) {
        try {
          console.log("☁️  Uploading PDF to storage...");
          pdfUrl = await pdfService.uploadPDFToStorage(pdfPath, order.id);
        } catch (uploadError) {
          warnings.push(`PDF upload failed: ${uploadError.message}`);
        }

        try {
          console.log("📧 Sending email...");
          await emailService.sendOrderEmail(orderDetails, pdfPath);
        } catch (emailError) {
          warnings.push(`Email failed: ${emailError.message}`);
        }

        try {
          console.log("📱 Sending WhatsApp message...");
          await whatsappService.sendOrderWhatsApp(orderDetails, pdfUrl);
        } catch (whatsappError) {
          warnings.push(`WhatsApp failed: ${whatsappError.message}`);
        }

        pdfService.deleteTempPDF(pdfPath);
      }

      res.status(201).json({
        message: "Order placed successfully",
        order: {
          id: order.id,
          status: order.status,
          created_at: order.created_at,
          pdf_url: pdfUrl,
        },
        warnings,
      });
    } catch (error) {
      console.error("Place order error:", error);
      res.status(500).json({
        error: "Failed to place order",
        details: error.message,
      });
    }
  }

  // Get customer's orders
  async getMyOrders(req, res) {
    try {
      const customerId = req.user.userId;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      let {
        data: orders,
        error,
        count,
      } = await supabase
        .from("orders")
        .select(
          `
          id,
          status,
          created_at,
          order_items (
            id,
            quantity,
            products (
              id,
              name,
              price,
              serial_number,
              image_url
            )
          )
        `,
          { count: "exact" },
        )
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error && this.constructor.isMissingSerialNumberColumn(error)) {
        const fallbackResult = await supabase
          .from("orders")
          .select(
            `
            id,
            status,
            created_at,
            order_items (
              id,
              quantity,
              products (
                id,
                name,
                price,
                image_url
              )
            )
          `,
            { count: "exact" },
          )
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        orders = fallbackResult.data;
        count = fallbackResult.count;
        error = fallbackResult.error;
      }

      if (error) throw error;

      res.status(200).json({
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      console.error("Get my orders error:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  }

  // Get all orders (Admin only)
  async getAllOrders(req, res) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase.from("orders").select(
        `
          id,
          status,
          created_at,
          customer_id,
          order_items (
            id,
            quantity,
            products (
              id,
              name,
              price,
              serial_number
            )
          )
        `,
        { count: "exact" },
      );

      if (status) {
        query = query.eq("status", status);
      }

      query = query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      let { data: orders, error, count } = await query;

      if (error && this.constructor.isMissingSerialNumberColumn(error)) {
        let fallbackQuery = supabase.from("orders").select(
          `
              id,
              status,
              created_at,
              customer_id,
              order_items (
                id,
                quantity,
                products (
                  id,
                  name,
                  price
                )
              )
            `,
          { count: "exact" },
        );

        if (status) {
          fallbackQuery = fallbackQuery.eq("status", status);
        }

        fallbackQuery = fallbackQuery
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        const fallbackResult = await fallbackQuery;
        orders = fallbackResult.data;
        error = fallbackResult.error;
        count = fallbackResult.count;
      }

      if (error) throw error;

      res.status(200).json({
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      console.error("Get all orders error:", error);
      if (error && error.message) {
        console.error("Error message:", error.message);
      }
      if (error && error.stack) {
        console.error("Error stack:", error.stack);
      }
      if (error && error.details) {
        console.error("Error details:", error.details);
      }
      if (error && error.hint) {
        console.error("Error hint:", error.hint);
      }
      res.status(500).json({ error: "Failed to fetch orders", details: error });
    }
  }

  // Get order by ID
  async getOrderById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      let query = supabase
        .from("orders")
        .select(
          `
          id,
          status,
          created_at,
          users (
            id,
            name,
            phone
          ),
          order_items (
            id,
            quantity,
            products (
              id,
              name,
              price,
              serial_number,
              image_url
            )
          )
        `,
        )
        .eq("id", id);

      // If customer, only show their own orders
      if (userRole === "customer") {
        query = query.eq("customer_id", userId);
      }

      let { data: order, error } = await query.single();

      if (error && OrderController.isMissingSerialNumberColumn(error)) {
        let fallbackQuery = supabase
          .from("orders")
          .select(
            `
            id,
            status,
            created_at,
            order_items (
              id,
              quantity,
              products (
                id,
                name,
                price,
                image_url
              )
            )
          `,
          )
          .eq("id", id);

        if (userRole === "customer") {
          fallbackQuery = fallbackQuery.eq("customer_id", userId);
        }

        const fallbackResult = await fallbackQuery.single();
        order = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (error || !order) {
        return res.status(404).json({ error: "Order not found" });
      }

      res.status(200).json({ order });
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  }

  // Update order status (Admin only)
  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const { data: order, error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return res.status(404).json({ error: "Order not found" });
        }
        throw error;
      }

      res.status(200).json({
        message: "Order status updated successfully",
        order,
      });
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  }

  // Get admin dashboard stats (Admin only)
  async getDashboardStats(req, res) {
    try {
      // Get total products
      const { count: totalProducts } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      // Get total orders
      const { count: totalOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true });

      // Get pending orders
      const { count: pendingOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Get total customers
      const { count: totalCustomers } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "customer");

      res.status(200).json({
        stats: {
          totalProducts: totalProducts || 0,
          totalOrders: totalOrders || 0,
          pendingOrders: pendingOrders || 0,
          totalCustomers: totalCustomers || 0,
        },
      });
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  }

  // Bulk update order status
  async bulkUpdateStatus(req, res) {
    try {
      const { orderIds, status } = req.body;

      const { data: orders, error } = await supabase
        .from("orders")
        .update({ status })
        .in("id", orderIds)
        .select();

      if (error) throw error;

      res.status(200).json({
        message: "Orders updated successfully",
        data: orders,
      });
    } catch (error) {
      console.error("Bulk update error:", error);
      res.status(500).json({ error: "Failed to bulk update orders" });
    }
  }

  // Export orders as CSV
  async exportOrders(req, res) {
    try {
      const { startDate, endDate } = req.query;

      let query = supabase
        .from("orders")
        .select(
          "*, users!fk_orders_customer(name, email, phone), order_items(quantity, products(name, price))",
        );

      if (startDate) query = query.gte("created_at", startDate);
      if (endDate) query = query.lte("created_at", endDate);

      const { data: orders, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;

      // Convert to CSV
      const headers = [
        "Order ID",
        "Date",
        "Customer",
        "Email",
        "Phone",
        "Total Items",
        "Products",
        "Status",
      ];
      const rows = orders.map((order) => [
        order.id,
        new Date(order.created_at).toLocaleDateString(),
        order.users?.name || "N/A",
        order.users?.email || "N/A",
        order.users?.phone || "N/A",
        order.order_items?.length || 0,
        (order.order_items || [])
          .map(
            (item) =>
              `${item.products?.name || "N/A"} (${item.quantity} x $${item.products?.price ?? "N/A"})`,
          )
          .join("; "),
        order.status,
      ]);

      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
      const fileName = `orders_export_${Date.now()}.csv`;

      // Generate PDF with all orders in a table
      const PDFDocument = require("pdfkit");
      const getBufferFromStream = (stream) => {
        return new Promise((resolve, reject) => {
          const chunks = [];
          stream.on("data", (chunk) => chunks.push(chunk));
          stream.on("end", () => resolve(Buffer.concat(chunks)));
          stream.on("error", reject);
        });
      };
      const doc = new PDFDocument({ margin: 30, size: "A4" });
      let pdfBufferPromise = getBufferFromStream(doc);

      doc.fontSize(18).text("Mayra Impex - Orders Export", { align: "center" });
      doc.moveDown(1);
      doc.fontSize(12);

      // Table header
      const colWidths = [60, 60, 80, 100, 70, 50, 120, 60];
      let x = doc.x,
        y = doc.y;
      headers.forEach((header, i) => {
        doc
          .font("Helvetica-Bold")
          .text(header, x, y, {
            width: colWidths[i],
            continued: i < headers.length - 1,
          });
        x += colWidths[i];
      });
      doc.moveDown(0.5);
      doc.font("Helvetica");

      // Table rows
      rows.forEach((row) => {
        x = doc.x;
        row.forEach((cell, i) => {
          doc.text(String(cell), x, doc.y, {
            width: colWidths[i],
            continued: i < row.length - 1,
          });
          x += colWidths[i];
        });
        doc.moveDown(0.5);
      });

      doc.end();
      const pdfBuffer = await pdfBufferPromise;

      let emailSent = false;
      let emailWarning = null;

      try {
        await emailService.sendCSVExportEmail({
          exportType: "Orders",
          fileName,
          csvContent: csv,
          requestedBy: { email: req.user?.email },
        });
        emailSent = true;
      } catch (mailError) {
        emailWarning = mailError.message;
      }

      res.status(200).json({
        message: "Orders exported",
        csv,
        fileName,
        emailSent,
        emailWarning,
      });
    } catch (error) {
      console.error("Export orders error:", error);
      res.status(500).json({ error: "Failed to export orders" });
    }
  }

  // Get detailed analytics
  async getDetailedAnalytics(req, res) {
    try {
      // Total sales
      const { data: allOrders } = await supabase
        .from("orders")
        .select("order_items(quantity, products(price))")
        .eq("status", "approved");

      const totalSales =
        allOrders?.reduce((sum, order) => {
          return (
            sum +
            (order.order_items?.reduce(
              (itemSum, item) =>
                itemSum + item.quantity * (item.products?.price || 0),
              0,
            ) || 0)
          );
        }, 0) || 0;

      // Sales by category
      const { data: categoryData } = await supabase
        .from("products")
        .select("categories(name), orders(id)", { count: "exact" });

      // Top products
      const { data: topProducts } = await supabase
        .from("order_items")
        .select("product_id, quantity, products(name, price)")
        .order("quantity", { ascending: false })
        .limit(5);

      res.status(200).json({
        analytics: {
          totalSales,
          topProducts,
          categoryData,
        },
      });
    } catch (error) {
      console.error("Get analytics error:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  }
}

module.exports = new OrderController();
