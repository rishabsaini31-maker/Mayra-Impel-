import React, { useEffect, useState } from "react";
import api from "../../lib/api";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/customers")
      .then((res) => {
        setCustomers(res.data.customers || []);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch customers");
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
        Customers Management
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
            <th>Email</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {customers.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                style={{ textAlign: "center", color: "#888", padding: 24 }}
              >
                No customers found.
              </td>
            </tr>
          ) : (
            customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.id}</td>
                <td>{customer.name}</td>
                <td>{customer.email}</td>
                <td>{customer.status}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
