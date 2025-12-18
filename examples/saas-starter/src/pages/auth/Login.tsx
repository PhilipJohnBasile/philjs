import { signal } from "philjs-core";
import { login } from "../../stores/authStore";
import { Link } from "philjs-router";

export function Login({ navigate }: { navigate: (path: string) => void }) {
  const email = signal("");
  const password = signal("");
  const error = signal<string | null>(null);
  const isLoading = signal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    error.set(null);
    isLoading.set(true);

    const result = await login(email(), password());

    if (result.success) {
      navigate("/dashboard");
    } else {
      error.set(result.error || "Login failed");
      isLoading.set(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "2rem",
    }}>
      <div style={{
        background: "white",
        borderRadius: "16px",
        padding: "3rem",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        width: "100%",
        maxWidth: "440px",
      }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{
            fontSize: "2rem",
            color: "#667eea",
            marginBottom: "0.5rem",
            fontWeight: "700",
          }}>
            Welcome Back
          </h1>
          <p style={{ color: "#666", fontSize: "0.95rem" }}>
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error() && (
            <div style={{
              padding: "0.875rem",
              background: "#fee",
              border: "1px solid #fcc",
              borderRadius: "8px",
              color: "#c33",
              fontSize: "0.9rem",
              marginBottom: "1.5rem",
            }}>
              {error()}
            </div>
          )}

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "#333",
              fontSize: "0.9rem",
              fontWeight: "500",
            }}>
              Email
            </label>
            <input
              type="email"
              value={email()}
              onInput={(e: any) => email.set(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: "100%",
                padding: "0.875rem",
                border: "2px solid #e9ecef",
                borderRadius: "8px",
                fontSize: "0.95rem",
                transition: "all 0.2s",
                outline: "none",
              }}
              onFocus={(e: any) => e.target.style.borderColor = "#667eea"}
              onBlur={(e: any) => e.target.style.borderColor = "#e9ecef"}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "#333",
              fontSize: "0.9rem",
              fontWeight: "500",
            }}>
              Password
            </label>
            <input
              type="password"
              value={password()}
              onInput={(e: any) => password.set(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              style={{
                width: "100%",
                padding: "0.875rem",
                border: "2px solid #e9ecef",
                borderRadius: "8px",
                fontSize: "0.95rem",
                transition: "all 0.2s",
                outline: "none",
              }}
              onFocus={(e: any) => e.target.style.borderColor = "#667eea"}
              onBlur={(e: any) => e.target.style.borderColor = "#e9ecef"}
            />
          </div>

          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "1.5rem",
          }}>
            <Link
              to="/auth/forgot-password"
              style={{
                color: "#667eea",
                fontSize: "0.9rem",
                textDecoration: "none",
                fontWeight: "500",
              }}
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading()}
            style={{
              width: "100%",
              padding: "0.875rem",
              background: isLoading() ? "#aaa" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: isLoading() ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              opacity: isLoading() ? "0.7" : "1",
            }}
          >
            {isLoading() ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div style={{
          marginTop: "2rem",
          textAlign: "center",
          color: "#666",
          fontSize: "0.9rem",
        }}>
          Don't have an account?{" "}
          <Link
            to="/auth/register"
            style={{
              color: "#667eea",
              textDecoration: "none",
              fontWeight: "600",
            }}
          >
            Sign up
          </Link>
        </div>

        <div style={{
          marginTop: "2rem",
          padding: "1rem",
          background: "#f8f9fa",
          borderRadius: "8px",
          fontSize: "0.85rem",
          color: "#666",
        }}>
          <strong>Demo credentials:</strong><br />
          Email: demo@example.com<br />
          Password: demo123
        </div>
      </div>
    </div>
  );
}
