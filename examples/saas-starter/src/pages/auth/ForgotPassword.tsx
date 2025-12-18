import { signal } from "philjs-core";
import { resetPassword } from "../../stores/authStore";
import { Link } from "philjs-router";

export function ForgotPassword() {
  const email = signal("");
  const error = signal<string | null>(null);
  const success = signal(false);
  const isLoading = signal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    error.set(null);
    isLoading.set(true);

    const result = await resetPassword(email());

    if (result.success) {
      success.set(true);
    } else {
      error.set(result.error || "Failed to send reset email");
    }

    isLoading.set(false);
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
            Reset Password
          </h1>
          <p style={{ color: "#666", fontSize: "0.95rem" }}>
            Enter your email to receive a reset link
          </p>
        </div>

        {!success() ? (
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
              {isLoading() ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        ) : (
          <div style={{
            padding: "1.5rem",
            background: "#d4edda",
            border: "1px solid #c3e6cb",
            borderRadius: "8px",
            color: "#155724",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>✓</div>
            <h3 style={{ marginBottom: "0.5rem" }}>Check your email</h3>
            <p>
              We've sent a password reset link to <strong>{email()}</strong>
            </p>
          </div>
        )}

        <div style={{
          marginTop: "2rem",
          textAlign: "center",
          color: "#666",
          fontSize: "0.9rem",
        }}>
          <Link
            to="/auth/login"
            style={{
              color: "#667eea",
              textDecoration: "none",
              fontWeight: "600",
            }}
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
