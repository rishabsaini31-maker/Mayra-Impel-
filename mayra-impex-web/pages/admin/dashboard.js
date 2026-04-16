import React, { useEffect, useState } from "react";
import api from "../../lib/api";

const defaultStats = [
  {
    title: "Total Products",
    key: "totalProducts",
    value: 0,
    bgColor: "#EFF6FF",
    color: "#3B82F6",
    icon: "📦",
  },
  {
    title: "Total Orders",
    key: "totalOrders",
    value: 0,
    bgColor: "#F0FDF4",
    color: "#10B981",
    icon: "🧾",
  },
  {
    title: "Pending Orders",
    key: "pendingOrders",
    value: 0,
    bgColor: "#FFFBEB",
    color: "#F59E0B",
    icon: "⏳",
  },
  {
    title: "Total Customers",
    key: "totalCustomers",
    value: 0,
    bgColor: "#F3E8FF",
    color: "#8B5CF6",
    icon: "👥",
  },
];

export default function Dashboard() {
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    api
      .get("/orders/dashboard-stats", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then((res) => {
        const apiStats = res.data.stats || {};
        setStats((prev) =>
          prev.map((stat) => ({
            ...stat,
            value: apiStats[stat.key] ?? 0,
          }))
        );
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load dashboard stats");
        setLoading(false);
      });
  }, []);

  return (
    <div
      style={{ padding: "32px 24px", background: "#fff", minHeight: "100vh" }}
    >
      <h2
        style={{
          textAlign: "center",
          fontWeight: 800,
          fontSize: 32,
          marginBottom: 4,
          color: "#111827",
        }}
      >
        Dashboard Overview
      </h2>
      <div
        style={{
          textAlign: "center",
          color: "#6B7280",
          marginBottom: 32,
          fontSize: 16,
        }}
      >
        Key metrics and statistics
      </div>
      {loading && (
        <div style={{ textAlign: "center", color: "#888" }}>Loading...</div>
      )}
      {error && (
        <div style={{ textAlign: "center", color: "red" }}>{error}</div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 24,
          marginBottom: 40,
        }}
      >
        {stats.map((stat, i) => (
          <div
            key={i}
            style={{
              background: stat.bgColor,
              borderRadius: 16,
              border: "1px solid #E5E7EB",
              boxShadow: "0 2px 8px #0001",
              padding: "32px 16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 120,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>{stat.icon}</div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: stat.color,
                marginBottom: 4,
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, textAlign: "center" }}>
              {stat.title}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          maxWidth: 480,
          margin: "40px auto 0",
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #E5E7EB",
          boxShadow: "0 2px 8px #0001",
          padding: 32,
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
          Business Summary
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <span style={{ color: "#6B7280" }}>Revenue Status</span>
          <span style={{ fontWeight: 600, color: "#10B981" }}>Active</span>
        </div>
        <div style={{ height: 1, background: "#E5E7EB", margin: "12px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#6B7280" }}>Last Updated</span>
          <span style={{ fontWeight: 600 }}>
            {new Date().toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
