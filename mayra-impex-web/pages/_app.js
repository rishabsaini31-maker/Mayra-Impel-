import React from "react";
import { useRouter } from "next/router";
import AdminSidebar from "../components/AdminSidebar";

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const isAdminRoute = router.pathname.startsWith("/admin");
  return (
    <div style={{ display: "flex" }}>
      {isAdminRoute && <AdminSidebar />}
      <div
        style={{
          marginLeft: isAdminRoute ? 220 : 0,
          flex: 1,
          minHeight: "100vh",
        }}
      >
        <Component {...pageProps} />
      </div>
    </div>
  );
}
