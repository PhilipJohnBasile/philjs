export function SecurityGuide() {
  return (
    <div style="margin: 2rem 0;">
      <h2>Security Best Practices</h2>

      <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid var(--color-error); padding: 1rem 1.25rem; border-radius: 8px; margin: 1.5rem 0;">
        <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600; color: #dc2626; margin-bottom: 0.5rem;">
          <span>🔒</span>
          <span>Security</span>
        </div>
        <div style="color: var(--color-text);">
          Always implement proper security headers in production. The examples below show recommended configurations.
        </div>
      </div>

      <h3>Content Security Policy (CSP)</h3>
      <p>Add CSP headers to prevent XSS and other injection attacks:</p>

      <pre style="background: var(--color-bg-code); padding: 1.25rem; border-radius: 8px; overflow-x: auto; margin-bottom: 1.5rem; border: 1px solid var(--color-code-border);"><code>{`// vite.config.ts or next.config.js
export default {
  headers: {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.yourdomain.com",
      "frame-ancestors 'none'",
    ].join('; '),
  },
};`}</code></pre>

      <h3>Essential Security Headers</h3>
      <p>Implement these headers in your server configuration:</p>

      <pre style="background: var(--color-bg-code); padding: 1.25rem; border-radius: 8px; overflow-x: auto; margin-bottom: 1.5rem; border: 1px solid var(--color-code-border);"><code>{`// Recommended security headers
{
  // Prevent clickjacking
  "X-Frame-Options": "DENY",

  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",

  // Enable XSS protection
  "X-XSS-Protection": "1; mode=block",

  // Enforce HTTPS
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",

  // Control referrer information
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Restrict permissions
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()"
}`}</code></pre>

      <h3>API Security</h3>
      <ul style="margin: 1rem 0; padding-left: 1.75rem;">
        <li style="margin-bottom: 0.5rem;">Use HTTPS for all API endpoints</li>
        <li style="margin-bottom: 0.5rem;">Implement rate limiting to prevent abuse</li>
        <li style="margin-bottom: 0.5rem;">Validate and sanitize all user inputs</li>
        <li style="margin-bottom: 0.5rem;">Use authentication tokens (JWT, OAuth)</li>
        <li style="margin-bottom: 0.5rem;">Never expose sensitive data in client-side code</li>
      </ul>

      <h3>Environment Variables</h3>
      <p>Store sensitive configuration in environment variables:</p>

      <pre style="background: var(--color-bg-code); padding: 1.25rem; border-radius: 8px; overflow-x: auto; margin-bottom: 1.5rem; border: 1px solid var(--color-code-border);"><code>{`// .env.example
API_KEY=your_api_key_here
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret_here

// Never commit .env to version control!
// Add to .gitignore:
// .env
// .env.local
// .env.*.local`}</code></pre>

      <h3>Dependency Security</h3>
      <p>Keep dependencies up to date and scan for vulnerabilities:</p>

      <pre style="background: var(--color-bg-code); padding: 1.25rem; border-radius: 8px; overflow-x: auto; margin-bottom: 1.5rem; border: 1px solid var(--color-code-border);"><code>{`# Check for security vulnerabilities
npm audit
pnpm audit

# Fix automatically if possible
npm audit fix
pnpm audit --fix

# Use tools like Snyk or Dependabot
# for automated security monitoring`}</code></pre>

      <div style="background: rgba(34, 197, 94, 0.1); border-left: 4px solid var(--color-success); padding: 1rem 1.25rem; border-radius: 8px; margin: 1.5rem 0;">
        <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600; color: #22c55e; margin-bottom: 0.5rem;">
          <span>✓</span>
          <span>Best Practice</span>
        </div>
        <div style="color: var(--color-text);">
          Set up automated security scanning in your CI/CD pipeline to catch vulnerabilities before deployment.
        </div>
      </div>
    </div>
  );
}
