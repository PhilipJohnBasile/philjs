import { signal } from "philjs-core";
import { register } from "../../stores/authStore";
import { Link } from "philjs-router";

export function Register({ navigate }: { navigate: (path: string) => void }) {
  const name = signal("");
  const email = signal("");
  const password = signal("");
  const confirmPassword = signal("");
  const error = signal<string | null>(null);
  const isLoading = signal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    error.set(null);

    if (password() !== confirmPassword()) {
      error.set("Passwords don't match");
      return;
    }

    if (password().length < 6) {
      error.set("Password must be at least 6 characters");
      return;
    }

    isLoading.set(true);

    const result = await register(email(), password(), name());

    if (result.success) {
      navigate("/dashboard");
    } else {
      error.set(result.error || "Registration failed");
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
            Create Account
          </h1>
          <p style={{ color: "#666", fontSize: "0.95rem" }}>
            Get started with your free account
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
              Full Name
            </label>
            <input
              type="text"
              value={name()}
              onInput={(e: any) => name.set(e.target.value)}
              placeholder="John Doe"
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

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "#333",
              fontSize: "0.9rem",
              fontWeight: "500",
            }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword()}
              onInput={(e: any) => confirmPassword.set(e.target.value)}
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
            {isLoading() ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div style={{
          marginTop: "2rem",
          textAlign: "center",
          color: "#666",
          fontSize: "0.9rem",
        }}>
          Already have an account?{" "}
          <Link
            to="/auth/login"
            style={{
              color: "#667eea",
              textDecoration: "none",
              fontWeight: "600",
            }}
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
