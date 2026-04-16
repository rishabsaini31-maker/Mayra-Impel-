// Edit and Delete handlers
const handleEditProduct = (product) => {
  setShowAddModal(true);
  setAddForm({
    name: product.name,
    category: product.categoryName || product.category?.name || "",
    price: product.price,
    sku: product.sku,
    description: product.description,
    image: null,
    id: product.id,
  });
};

const handleDeleteProduct = async (id) => {
  if (!window.confirm("Are you sure you want to delete this product?")) return;
  setLoading(true);
  try {
    await api.delete(`/products/${id}`);
    setProducts(products.filter((p) => p.id !== id));
    setLoading(false);
  } catch {
    setError("Failed to delete product");
    setLoading(false);
  }
};

import api from "../../lib/api";
import React, { useEffect, useState, useRef } from "react";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    category: "",
    price: "",
    sku: "",
    description: "",
    image: null,
    id: undefined,
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const fileInputRef = useRef();

  useEffect(() => {
    api.get("/categories").then((res) => {
      setCategories(res.data.categories || []);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .get("/products")
      .then((res) => {
        setProducts(res.data.products || []);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch products");
        setLoading(false);
      });
  }, []);

  const handleExportCSV = async () => {
    try {
      const res = await api.get("/products/export/csv", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "products.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Failed to export CSV");
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      search === "" ||
      product.name?.toLowerCase().includes(search.toLowerCase()) ||
      product.id?.toString().includes(search);
    const matchesStatus =
      statusFilter === "" || product.status === statusFilter;
    const matchesCategory =
      categoryFilter === "" ||
      product.categoryName === categoryFilter ||
      product.category?.name === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div
      style={{
        marginLeft: 0,
        padding: 32,
        minHeight: "100vh",
        background: "#f9fafb",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          fontWeight: 800,
          fontSize: 28,
          marginBottom: 24,
        }}
      >
        Products Management
      </h2>
      <div
        style={{
          display: "flex",
          gap: 16,
          margin: "0 0 24px 0",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Search by name or ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: 8,
            borderRadius: 6,
            border: "1px solid #e5e7eb",
            minWidth: 180,
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: "1px solid #e5e7eb" }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: "1px solid #e5e7eb" }}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleExportCSV}
          style={{
            padding: "8px 18px",
            borderRadius: 6,
            background: "#2563eb",
            color: "#fff",
            border: "none",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Export CSV
        </button>
        <button
          style={{
            padding: "8px 18px",
            borderRadius: 6,
            background: "#059669",
            color: "#fff",
            border: "none",
            fontWeight: 600,
            cursor: "pointer",
          }}
          onClick={() => setShowAddModal(true)}
        >
          Add Product
        </button>
        {/* Add Product Modal */}
        {showAddModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "#0008",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 10,
                padding: 32,
                minWidth: 340,
                maxWidth: 400,
                boxShadow: "0 4px 24px #0002",
                position: "relative",
              }}
            >
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 16,
                  background: "none",
                  border: "none",
                  fontSize: 22,
                  cursor: "pointer",
                }}
              >
                &times;
              </button>
              <h3
                style={{
                  fontWeight: 700,
                  fontSize: 22,
                  marginBottom: 18,
                  textAlign: "center",
                }}
              >
                {addForm.id ? "Edit Product" : "Add Product"}
              </h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setAddLoading(true);
                  setAddError("");
                  try {
                    const formData = new FormData();
                    formData.append("name", addForm.name);
                    formData.append("category", addForm.category);
                    formData.append("price", addForm.price);
                    formData.append("sku", addForm.sku);
                    formData.append("description", addForm.description);
                    if (addForm.image) formData.append("image", addForm.image);
                    if (addForm.id) {
                      await api.put(`/products/${addForm.id}`, formData, {
                        headers: { "Content-Type": "multipart/form-data" },
                      });
                    } else {
                      await api.post("/products", formData, {
                        headers: { "Content-Type": "multipart/form-data" },
                      });
                    }
                    setShowAddModal(false);
                    setAddForm({
                      name: "",
                      category: "",
                      price: "",
                      sku: "",
                      description: "",
                      image: null,
                      id: undefined,
                    });
                    setAddLoading(false);
                    // Refresh products
                    setLoading(true);
                    const res = await api.get("/products");
                    setProducts(res.data.products || []);
                    setLoading(false);
                  } catch (err) {
                    setAddError("Failed to save product");
                    setAddLoading(false);
                  }
                }}
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <input
                  type="text"
                  placeholder="Product Name"
                  value={addForm.name}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                  style={{
                    padding: 8,
                    borderRadius: 6,
                    border: "1px solid #e5e7eb",
                  }}
                />
                <select
                  value={addForm.category}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, category: e.target.value }))
                  }
                  required
                  style={{
                    padding: 8,
                    borderRadius: 6,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Price"
                  value={addForm.price}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, price: e.target.value }))
                  }
                  required
                  min="0"
                  style={{
                    padding: 8,
                    borderRadius: 6,
                    border: "1px solid #e5e7eb",
                  }}
                />
                <input
                  type="text"
                  placeholder="Serial Number (SKU)"
                  value={addForm.sku}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, sku: e.target.value }))
                  }
                  required
                  style={{
                    padding: 8,
                    borderRadius: 6,
                    border: "1px solid #e5e7eb",
                  }}
                />
                <textarea
                  placeholder="Description"
                  value={addForm.description}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={3}
                  style={{
                    padding: 8,
                    borderRadius: 6,
                    border: "1px solid #e5e7eb",
                  }}
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, image: e.target.files[0] }))
                  }
                  style={{ marginBottom: 8 }}
                />
                {addError && (
                  <div style={{ color: "red", textAlign: "center" }}>
                    {addError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={addLoading}
                  style={{
                    padding: 10,
                    borderRadius: 6,
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    fontWeight: 600,
                    cursor: addLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {addLoading ? "Adding..." : "Add Product"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
      {loading && <p>Loading...</p>}
      {error && (
        <p style={{ color: "red", textAlign: "center", margin: "16px 0" }}>
          {error === "Failed to fetch products"
            ? "Failed to fetch products. Please check your backend URL, CORS settings, and network connection."
            : error}
        </p>
      )}
      <div
        style={{
          overflowX: "auto",
          background: "#fff",
          borderRadius: 8,
          boxShadow: "0 2px 8px #0001",
          padding: 16,
        }}
      >
        <table
          style={{
            width: "100%",
            marginTop: 0,
            borderCollapse: "collapse",
            background: "#fff",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  border: "1px solid #e5e7eb",
                  padding: 12,
                  background: "#f3f4f6",
                }}
              >
                ID
              </th>
              <th
                style={{
                  border: "1px solid #e5e7eb",
                  padding: 12,
                  background: "#f3f4f6",
                }}
              >
                Image
              </th>
              <th
                style={{
                  border: "1px solid #e5e7eb",
                  padding: 12,
                  background: "#f3f4f6",
                }}
              >
                Name
              </th>
              <th
                style={{
                  border: "1px solid #e5e7eb",
                  padding: 12,
                  background: "#f3f4f6",
                }}
              >
                Category
              </th>
              <th
                style={{
                  border: "1px solid #e5e7eb",
                  padding: 12,
                  background: "#f3f4f6",
                }}
              >
                Price
              </th>
              <th
                style={{
                  border: "1px solid #e5e7eb",
                  padding: 12,
                  background: "#f3f4f6",
                }}
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: "center",
                    color: "#888",
                    padding: 24,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  No products found.
                </td>
              </tr>
            ) : (
              filteredProducts.map((product, idx) => (
                <tr
                  key={product.id}
                  style={{ background: idx % 2 === 0 ? "#f9fafb" : "#fff" }}
                >
                  <td style={{ border: "1px solid #e5e7eb", padding: 10 }}>
                    {product.id}
                  </td>
                  <td style={{ border: "1px solid #e5e7eb", padding: 10 }}>
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6 }}
                      />
                    ) : (
                      <span style={{ color: "#bbb" }}>No Image</span>
                    )}
                  </td>
                  <td style={{ border: "1px solid #e5e7eb", padding: 10 }}>
                    {product.name}
                  </td>
                  <td style={{ border: "1px solid #e5e7eb", padding: 10 }}>
                    {product.categoryName || product.category?.name}
                  </td>
                  <td style={{ border: "1px solid #e5e7eb", padding: 10 }}>
                    {product.price}
                  </td>
                  <td style={{ border: "1px solid #e5e7eb", padding: 10 }}>
                    {product.status}
                  </td>
                  <td style={{ border: "1px solid #e5e7eb", padding: 10 }}>
                    <button
                      style={{
                        marginRight: 8,
                        padding: "4px 12px",
                        borderRadius: 4,
                        background: "#2563eb",
                        color: "#fff",
                        border: "none",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                      onClick={() => handleEditProduct(product)}
                    >
                      Edit
                    </button>
                    <button
                      style={{
                        padding: "4px 12px",
                        borderRadius: 4,
                        background: "#dc2626",
                        color: "#fff",
                        border: "none",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
