# Security Checklist

A comprehensive security checklist for PhilJS applications. Use this before deploying to production and during regular security audits.

## Pre-Deployment Checklist

### Application Security

#### Input Validation
- [ ] All user input is validated on the server-side
- [ ] Input validation uses strict schemas (e.g., Zod, Yup)
- [ ] File uploads are validated (type, size, content)
- [ ] URL parameters are validated and sanitized
- [ ] Form data is validated before processing
- [ ] JSON payloads are validated against schemas
- [ ] Email addresses are validated with proper regex
- [ ] Phone numbers are validated with proper format
- [ ] Dates and times are validated and normalized
- [ ] Numeric inputs have min/max constraints

#### Output Encoding
- [ ] All user-generated content is HTML-escaped
- [ ] JavaScript context escaping is used when needed
- [ ] URL parameters are properly encoded
- [ ] CSS values are escaped when user-controlled
- [ ] JSON responses are properly serialized
- [ ] XML/SVG content is sanitized
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] Rich text content uses allowlist-based sanitization

#### XSS Prevention
- [ ] Content Security Policy is configured
- [ ] CSP uses nonces for inline scripts
- [ ] No `unsafe-inline` in script-src (or uses nonces/hashes)
- [ ] No `unsafe-eval` in script-src
- [ ] Event handlers use function references, not strings
- [ ] Dynamic URLs are validated before use
- [ ] SVG content is sanitized
- [ ] User avatars/images are from trusted sources only

#### CSRF Protection
- [ ] CSRF tokens are used for all state-changing operations
- [ ] CSRF tokens are cryptographically random
- [ ] CSRF tokens are validated on the server
- [ ] SameSite cookie attribute is set
- [ ] Origin header is validated
- [ ] Double-submit cookie pattern is used (if applicable)

### Authentication & Authorization

#### Authentication
- [ ] Passwords are hashed with bcrypt (12+ rounds)
- [ ] Password strength requirements are enforced
- [ ] Account lockout after failed login attempts
- [ ] Rate limiting on login endpoints
- [ ] Email verification is required for new accounts
- [ ] Password reset uses time-limited tokens
- [ ] Password reset tokens are single-use
- [ ] Sessions have reasonable timeout (1-24 hours)
- [ ] Session IDs are cryptographically random
- [ ] Sessions are invalidated on logout
- [ ] Old sessions are cleaned up regularly
- [ ] Multi-factor authentication is available (optional or required)

#### Session Management
- [ ] Sessions stored securely (Redis in production)
- [ ] Session cookies have HttpOnly flag
- [ ] Session cookies have Secure flag
- [ ] Session cookies use SameSite=Strict or Lax
- [ ] Session fixation is prevented
- [ ] Session hijacking protections in place
- [ ] Concurrent session limits (if needed)

#### Authorization
- [ ] Role-based access control is implemented
- [ ] Permission checks on all protected resources
- [ ] User can only access their own data
- [ ] Admin functions require admin role
- [ ] API endpoints check authorization
- [ ] Client-side authorization matches server-side

### API Security

#### General API Security
- [ ] Rate limiting on all API endpoints
- [ ] Different rate limits for different endpoints
- [ ] API authentication is required
- [ ] API authorization checks are in place
- [ ] API versioning is used
- [ ] CORS is properly configured
- [ ] API documentation doesn't expose secrets
- [ ] API errors don't leak sensitive information

#### API Input/Output
- [ ] Request body size limits are enforced
- [ ] Content-Type validation is performed
- [ ] All API inputs are validated
- [ ] SQL injection prevention (parameterized queries)
- [ ] NoSQL injection prevention
- [ ] Command injection prevention
- [ ] Path traversal prevention
- [ ] Responses don't include sensitive data

### Data Protection

#### Encryption
- [ ] HTTPS is enforced (no HTTP in production)
- [ ] TLS 1.2+ is used
- [ ] Strong cipher suites are configured
- [ ] Sensitive data is encrypted at rest
- [ ] Database connections use encryption
- [ ] Backup data is encrypted
- [ ] API keys/tokens are encrypted in storage

#### Secrets Management
- [ ] No secrets in code or version control
- [ ] Environment variables for configuration
- [ ] Secrets are rotated regularly
- [ ] Different secrets for different environments
- [ ] Secret management service used (e.g., Vault)
- [ ] Database credentials are secured
- [ ] API keys are secured
- [ ] Cookie secrets are random and secure

#### Data Handling
- [ ] Sensitive data is not logged
- [ ] PII is minimized and protected
- [ ] Credit card data follows PCI DSS
- [ ] User data can be exported (GDPR)
- [ ] User data can be deleted (GDPR/CCPA)
- [ ] Data retention policies are implemented
- [ ] Audit logs for sensitive operations

### Infrastructure Security

#### Server Configuration
- [ ] Server OS is up to date
- [ ] Unnecessary services are disabled
- [ ] Firewall rules are configured
- [ ] SSH uses key-based authentication
- [ ] Root login is disabled
- [ ] Fail2ban or similar is configured
- [ ] Regular security updates are applied

#### Application Deployment
- [ ] Production uses separate database
- [ ] Database has restricted access
- [ ] Application runs as non-root user
- [ ] File permissions are restrictive
- [ ] Directory listing is disabled
- [ ] Debug mode is disabled in production
- [ ] Source maps are not deployed (or protected)
- [ ] Error details are not exposed

#### Network Security
- [ ] HTTPS redirect is configured
- [ ] HTTP Strict Transport Security (HSTS) header
- [ ] DDoS protection is in place
- [ ] CDN uses secure configuration
- [ ] DNS uses DNSSEC
- [ ] IP allowlisting for admin functions

### Dependency Security

#### Dependency Management
- [ ] Dependencies are up to date
- [ ] `pnpm audit` shows no critical issues
- [ ] Automated dependency updates (Dependabot)
- [ ] Dependencies are from trusted sources
- [ ] Lock files are committed
- [ ] Unused dependencies are removed
- [ ] Vulnerability scanning is automated

#### Known Vulnerabilities
- [ ] js-yaml updated to 4.1.1+ (moderate severity)
- [ ] undici updated to 5.28.5+ (moderate severity)
- [ ] esbuild updated to latest (low severity)
- [ ] glob updated to 10.5.0+ (high severity)
- [ ] All critical CVEs are patched

### Security Headers

#### Required Headers
- [ ] Content-Security-Policy is configured
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY or SAMEORIGIN
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Referrer-Policy: strict-origin-when-cross-origin
- [ ] Permissions-Policy configured
- [ ] Strict-Transport-Security (HSTS) configured

### Monitoring & Logging

#### Logging
- [ ] Security events are logged
- [ ] Authentication attempts are logged
- [ ] Authorization failures are logged
- [ ] Input validation failures are logged
- [ ] Error logs don't contain secrets
- [ ] Logs are centralized
- [ ] Log retention policy is defined
- [ ] Logs are protected from tampering

#### Monitoring
- [ ] Uptime monitoring is configured
- [ ] Error rate monitoring is set up
- [ ] Failed login monitoring
- [ ] CSP violation monitoring
- [ ] Rate limit violation alerts
- [ ] Suspicious activity alerts
- [ ] Performance monitoring

## Development Checklist

### Code Security

#### Secure Coding Practices
- [ ] TypeScript strict mode is enabled
- [ ] ESLint security rules are configured
- [ ] No hardcoded credentials
- [ ] No console.log of sensitive data
- [ ] Error handling doesn't expose internals
- [ ] Regular code reviews include security
- [ ] Security testing in CI/CD pipeline

#### Third-Party Integrations
- [ ] Third-party scripts are from CDN with SRI
- [ ] OAuth apps have minimal permissions
- [ ] Webhook signatures are verified
- [ ] API integrations use HTTPS
- [ ] Third-party cookies are minimized

### Testing

#### Security Testing
- [ ] XSS testing with common payloads
- [ ] CSRF protection is tested
- [ ] Authentication bypass attempts tested
- [ ] Authorization bypass attempts tested
- [ ] Input validation edge cases tested
- [ ] Rate limiting is tested
- [ ] Session management is tested
- [ ] Error handling is tested

#### Automated Testing
- [ ] Security tests in test suite
- [ ] Dependency scanning in CI
- [ ] SAST (Static Application Security Testing)
- [ ] DAST (Dynamic Application Security Testing)
- [ ] Container scanning (if using containers)

## Operational Checklist

### Incident Response

#### Preparation
- [ ] Incident response plan documented
- [ ] Security contacts defined
- [ ] Escalation procedures defined
- [ ] Backup and recovery procedures tested
- [ ] Communication plan for breaches

#### Detection & Response
- [ ] Security monitoring is active
- [ ] Alert thresholds are configured
- [ ] Response team is trained
- [ ] Forensics tools are available
- [ ] Breach notification process defined

### Compliance

#### Regulatory Compliance
- [ ] GDPR compliance (if EU users)
- [ ] CCPA compliance (if CA users)
- [ ] HIPAA compliance (if health data)
- [ ] PCI DSS compliance (if handling cards)
- [ ] SOC 2 compliance (if enterprise)
- [ ] Privacy policy is up to date
- [ ] Terms of service are up to date

### Business Continuity

#### Backup & Recovery
- [ ] Regular backups are performed
- [ ] Backups are tested
- [ ] Backup encryption is enabled
- [ ] Disaster recovery plan exists
- [ ] RTO and RPO are defined
- [ ] Backup restoration is tested

## Periodic Review (Quarterly)

### Security Review
- [ ] Review access controls
- [ ] Review user permissions
- [ ] Review API keys and tokens
- [ ] Review third-party integrations
- [ ] Review security logs
- [ ] Review incident reports
- [ ] Update security documentation

### Penetration Testing
- [ ] Annual penetration testing
- [ ] Bug bounty program (optional)
- [ ] Vulnerability disclosure program
- [ ] Security audit by third party

### Training & Awareness
- [ ] Security training for developers
- [ ] Security awareness for all staff
- [ ] Phishing simulation tests
- [ ] Security best practices documented
- [ ] Security champions program

## PhilJS-Specific Checks

### Framework Security
- [ ] PhilJS version is up to date
- [ ] Security utilities are used correctly
- [ ] CSP configuration is optimal
- [ ] CSRF protection is enabled
- [ ] Rate limiting is configured
- [ ] Session management is secure
- [ ] Cookie settings are secure

### SSR Security
- [ ] Server-side validation is in place
- [ ] State serialization is secure
- [ ] No secrets in client bundles
- [ ] Hydration data is validated
- [ ] CSP nonces are used for inline scripts
- [ ] Server rendering doesn't leak data

### Client Security
- [ ] Client-side validation is supplementary
- [ ] No sensitive operations client-side only
- [ ] State is not user-modifiable
- [ ] XSS protection is tested
- [ ] CSP is enforced

## Quick Start Security Checklist

For a minimum viable secure application:

1. **HTTPS Only**
   - Force HTTPS redirect
   - Set HSTS header

2. **Authentication**
   - Hash passwords with bcrypt
   - Validate password strength
   - Use secure session cookies

3. **Input Validation**
   - Validate all user input
   - Use schema validation
   - Escape output

4. **CSRF Protection**
   - Enable CSRF tokens
   - Set SameSite cookies

5. **Rate Limiting**
   - Limit login attempts
   - Limit API requests

6. **Security Headers**
   - Set CSP
   - Set X-Frame-Options
   - Set X-Content-Type-Options

7. **Dependencies**
   - Run `pnpm audit`
   - Fix critical vulnerabilities

8. **Secrets**
   - Use environment variables
   - No secrets in code

9. **Error Handling**
   - Don't expose internals
   - Log errors securely

10. **Monitoring**
    - Monitor failed logins
    - Monitor errors
    - Set up alerts

## Severity Levels

Use this guide to prioritize issues:

### Critical (Fix Immediately)
- SQL injection vulnerabilities
- Authentication bypass
- Exposed admin credentials
- Remote code execution
- Critical dependency CVEs

### High (Fix Within 24 Hours)
- XSS vulnerabilities
- CSRF vulnerabilities
- Authorization bypass
- Insecure direct object references
- High severity dependency CVEs

### Medium (Fix Within 1 Week)
- Missing rate limiting
- Weak password policies
- Information disclosure
- Missing security headers
- Medium severity dependency CVEs

### Low (Fix in Next Release)
- Verbose error messages
- Missing HSTS
- Outdated dependencies (no CVE)
- Missing CSP directives
- Low severity dependency CVEs

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [PhilJS Security Overview](./overview.md)
- [XSS Prevention Guide](./xss-prevention.md)
- [API Security Guide](./api-security.md)
- [Authentication Patterns](./authentication.md)
- [CSP Guide](./csp.md)

## Checklist Versions

Track which version of this checklist you've completed:

- [ ] Initial security review completed: ___________
- [ ] Q1 security review completed: ___________
- [ ] Q2 security review completed: ___________
- [ ] Q3 security review completed: ___________
- [ ] Q4 security review completed: ___________

---

**Remember**: Security is an ongoing process, not a one-time task. Review this checklist regularly and stay informed about new vulnerabilities and best practices.
