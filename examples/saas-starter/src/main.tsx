import { render, signal } from "@philjs/core";
import { initAuth, isAuthenticated, user, logout } from "./stores/authStore";
import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";
import { ForgotPassword } from "./pages/auth/ForgotPassword";

// Initialize auth state from localStorage
initAuth();

const currentPath = signal(window.location.pathname);

// Simple navigation handler
function navigate(path: string) {
  window.history.pushState({}, "", path);
  currentPath.set(path);
}

// Listen for browser back/forward navigation
window.addEventListener("popstate", () => {
  currentPath.set(window.location.pathname);
});

function App() {
  const path = currentPath();

  // Auth pages
  if (path === "/auth/login" || path === "/") {
    return <Login navigate={navigate} />;
  }
  if (path === "/auth/register") {
    return <Register navigate={navigate} />;
  }
  if (path === "/auth/forgot-password") {
    return <ForgotPassword />;
  }

  // Dashboard (authenticated)
  if (path === "/dashboard") {
    if (!isAuthenticated()) {
      navigate("/auth/login");
      return <Login navigate={navigate} />;
    }

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f5f5f5",
        }}
      >
        <nav
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1rem 2rem",
            background: "white",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <h1
            style={{
              fontSize: "1.25rem",
              color: "#667eea",
              fontWeight: "700",
            }}
          >
            PhilJS SaaS
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ color: "#666", fontSize: "0.9rem" }}>
              {user()?.name}
            </span>
            <button
              onClick={() => {
                logout();
                navigate("/auth/login");
              }}
              style={{
                padding: "0.5rem 1rem",
                background: "none",
                border: "1px solid #ddd",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.85rem",
                color: "#666",
              }}
            >
              Sign Out
            </button>
          </div>
        </nav>
        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
          <h2 style={{ color: "#333", marginBottom: "1rem" }}>
            Welcome, {user()?.name}!
          </h2>
          <p style={{ color: "#666" }}>
            You are signed in with the <strong>{user()?.plan}</strong> plan.
          </p>
        </div>
      </div>
    );
  }

  // Fallback - redirect to login
  navigate("/auth/login");
  return <Login navigate={navigate} />;
}

const root = document.getElementById("app");
if (root) {
  render(() => <App />, root);
}
