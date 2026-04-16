import React, { useEffect, useState } from "react";
import api from "../../lib/api";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/categories")
      .then((res) => {
        setCategories(res.data.categories || []);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch categories");
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h2
        style={{
          textAlign: "center",
          fontWeight: 800,
          fontSize: 28,
          marginBottom: 24,
        }}
      >
        Categories Management
      </h2>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <table
        style={{ width: "100%", marginTop: 20, borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {categories.length === 0 ? (
            <tr>
              <td
                colSpan={3}
                style={{ textAlign: "center", color: "#888", padding: 24 }}
              >
                No categories found.
              </td>
            </tr>
          ) : (
            categories.map((category) => (
              <tr key={category.id}>
                <td>{category.id}</td>
                <td>{category.name}</td>
                <td>{category.description}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
