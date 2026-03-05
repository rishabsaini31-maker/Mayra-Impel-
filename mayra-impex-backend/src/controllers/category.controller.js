const { supabase } = require("../config/supabase");

class CategoryController {
  // Get all categories
  async getAllCategories(req, res) {
    try {
      const { data: categories, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      res.status(200).json({
        categories,
        count: categories.length,
      });
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  }

  // Create category (Admin only)
  async createCategory(req, res) {
    try {
      const { name } = req.body;

      // Check if category exists
      const { data: existing } = await supabase
        .from("categories")
        .select("id")
        .eq("name", name)
        .is("deleted_at", null)
        .maybeSingle();

      if (existing) {
        return res.status(409).json({ error: "Category already exists" });
      }

      const { data: category, error } = await supabase
        .from("categories")
        .insert({ name })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        message: "Category created successfully",
        category,
      });
    } catch (error) {
      console.error("Create category error:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  }

  // Delete category (Admin only)
  async deleteCategory(req, res) {
    try {
      const { id } = req.params;

      // Check if category has products
      const { data: products } = await supabase
        .from("products")
        .select("id")
        .eq("category_id", id)
        .is("deleted_at", null)
        .limit(1);

      if (products && products.length > 0) {
        return res.status(400).json({
          error: "Cannot delete category with existing products",
        });
      }

      const { error } = await supabase
        .from("categories")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .is("deleted_at", null);

      if (error) throw error;

      res.status(200).json({ message: "Category archived successfully" });
    } catch (error) {
      console.error("Delete category error:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  }
}

module.exports = new CategoryController();
