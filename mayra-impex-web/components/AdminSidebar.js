import Link from "next/link";
import { useRouter } from "next/router";

const menuItems = [
  { label: "Dashboard", path: "/admin/dashboard" },
  { label: "Orders", path: "/admin/orders" },
  { label: "Products", path: "/admin/products" },
  { label: "Customers", path: "/admin/customers" },
  { label: "Categories", path: "/admin/categories" },
  { label: "Banners", path: "/admin/banners" },
  { label: "Activity Log", path: "/admin/activity" },
  { label: "Segments", path: "/admin/segments" },
  { label: "Analytics", path: "/admin/analytics" },
  { label: "Settings", path: "/admin/settings" },
  { label: "Profile", path: "/admin/profile" },
];

export default function AdminSidebar() {
  const router = useRouter();
  return (
    <aside
      style={{
        width: 220,
        background: "#1F2937",
        color: "#fff",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        display: "flex",
        flexDirection: "column",
        padding: 24,
      }}
    >
      <h2
        style={{
          marginBottom: 32,
          fontWeight: "bold",
          fontSize: 22,
          letterSpacing: 1,
        }}
      >
        Admin
      </h2>
      <nav style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {menuItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            style={{
              color: router.pathname === item.path ? "#3b82f6" : "#fff",
              background: router.pathname === item.path ? "#fff2" : "none",
              padding: "10px 16px",
              borderRadius: 6,
              textDecoration: "none",
              fontWeight: router.pathname === item.path ? "bold" : "normal",
              transition: "all .2s",
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
