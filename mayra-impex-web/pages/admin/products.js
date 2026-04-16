import api from "../../lib/api";
import React, { useEffect, useState } from "react";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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

  return (
    <div
      style={{
        padding: "32px 16px",
        minHeight: "100vh",
        boxSizing: "border-box",
        background: "#fff",
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
      {loading && <p>Loading...</p>}
      {error && (
        <p style={{ color: "red", textAlign: "center", margin: "16px 0" }}>
          {error === "Failed to fetch products"
            ? "Failed to fetch products. Please check your backend URL, CORS settings, and network connection."
            : error}
        </p>
      )}
      <table
        style={{ width: "100%", marginTop: 20, borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                style={{ textAlign: "center", color: "#888", padding: 24 }}
              >
                No products found.
              </td>
            </tr>
          ) : (
            products.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>{product.categoryName || product.category?.name}</td>
                <td>{product.price}</td>
                <td>{product.stock}</td>
                <td>{product.status}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
