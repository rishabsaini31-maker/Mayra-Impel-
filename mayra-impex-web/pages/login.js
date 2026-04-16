import React, { useState } from "react";
import { useRouter } from "next/router";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const router = useRouter();

  // Placeholder: Check for biometric support (WebAuthn/FIDO2)
  React.useEffect(() => {
    if (window.PublicKeyCredential) {
      setBiometricAvailable(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Placeholder authentication logic
    if (username === "admin" && password === "admin") {
      router.push("/admin/dashboard");
    } else {
      setError("Invalid credentials");
    }
  };

  const handleBiometricLogin = () => {
    // Placeholder for biometric login logic (WebAuthn/FIDO2 integration required)
    alert("Biometric authentication is not yet implemented.");
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#f9fafb",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          minWidth: 320,
          background: "#fff",
          padding: 32,
          borderRadius: 12,
          boxShadow: "0 2px 16px #0001",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: 8 }}>Admin Login</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ padding: 10, borderRadius: 6, border: "1px solid #ddd" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: 10, borderRadius: 6, border: "1px solid #ddd" }}
        />
        <button
          type="submit"
          style={{
            padding: 10,
            borderRadius: 6,
            background: "#3b82f6",
            color: "#fff",
            border: "none",
            fontWeight: "bold",
          }}
        >
          Login
        </button>
        {biometricAvailable && (
          <button
            type="button"
            onClick={handleBiometricLogin}
            style={{
              padding: 10,
              borderRadius: 6,
              background: "#10b981",
              color: "#fff",
              border: "none",
              fontWeight: "bold",
            }}
          >
            Login with Biometric
          </button>
        )}
        {error && (
          <span style={{ color: "red", textAlign: "center" }}>{error}</span>
        )}
      </form>
    </div>
  );
}
