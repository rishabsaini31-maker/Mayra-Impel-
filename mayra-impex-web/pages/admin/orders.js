import api from "../../lib/api";
import React, { useEffect, useState } from "react";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/orders")
      .then((res) => {
        setOrders(res.data.orders || []);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch orders");
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
        Orders Management
      </h2>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <table
        style={{ width: "100%", marginTop: 20, borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Status</th>
            <th>Total</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                style={{ textAlign: "center", color: "#888", padding: 24 }}
              >
                No orders found.
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.customerName || order.customer?.name}</td>
                <td>{order.status}</td>
                <td>{order.total}</td>
                <td>
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleString()
                    : ""}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
