import * as React from 'react';
import { Text, Button, Section, Link } from '@react-email/components';
import { BaseEmail, textStyles, buttonStyles } from './base';
import type { BaseEmailProps } from './base';

/**
 * Password reset email template props
 */
export interface PasswordResetEmailProps extends Omit<BaseEmailProps, 'children'> {
  /** User's name (optional) */
  userName?: string;
  /** User's email */
  userEmail: string;
  /** Password reset URL */
  resetUrl: string;
  /** Reset token (if displaying inline) */
  resetToken?: string;
  /** Link expiration time in minutes */
  expiresIn?: number;
  /** IP address that requested the reset */
  ipAddress?: string;
  /** Browser/device info */
  deviceInfo?: string;
  /** Request timestamp */
  requestedAt?: Date;
}

/**
 * Password Reset Email Template
 *
 * Sent when a user requests a password reset. Includes:
 * - Security information
 * - Reset link with expiration
 * - Optional inline code
 * - Request details
 */
export function PasswordResetEmail({
  userName,
  userEmail,
  resetUrl,
  resetToken,
  expiresIn = 60,
  ipAddress,
  deviceInfo,
  requestedAt,
  appName = 'PhilJS',
  ...baseProps
}: PasswordResetEmailProps): React.ReactElement {
  const previewText = `Reset your ${appName} password`;
  const greeting = userName ? `Hi ${userName},` : 'Hello,';

  return (
    <BaseEmail
      preview={previewText}
      appName={appName}
      {...baseProps}
    >
      {/* Main heading */}
      <Text style={textStyles.heading}>Reset Your Password</Text>

      {/* Greeting */}
      <Text style={textStyles.paragraph}>{greeting}</Text>

      {/* Explanation */}
      <Text style={textStyles.paragraph}>
        We received a request to reset the password for the {appName} account
        associated with <strong>{userEmail}</strong>.
      </Text>

      {/* Call-to-action button */}
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={resetUrl} style={buttonStyles.primary}>
          Reset Password
        </Button>
      </Section>

      {/* Reset code (optional) */}
      {resetToken && (
        <Section
          style={{
            backgroundColor: '#f4f4f5',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center',
            margin: '24px 0',
          }}
        >
          <Text style={{ ...textStyles.small, margin: '0 0 8px' }}>
            Or enter this code manually:
          </Text>
          <code
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e4e4e7',
              borderRadius: '4px',
              color: '#1a1a1a',
              display: 'inline-block',
              fontSize: '24px',
              fontWeight: 'bold',
              letterSpacing: '4px',
              padding: '12px 24px',
              fontFamily: 'monospace',
            }}
          >
            {resetToken}
          </code>
        </Section>
      )}

      {/* Expiration notice */}
      <Text style={textStyles.small}>
        This link will expire in <strong>{expiresIn} minutes</strong>. If you
        didn't request a password reset, you can safely ignore this email.
      </Text>

      {/* Security information */}
      {(ipAddress || deviceInfo || requestedAt) && (
        <Section
          style={{
            backgroundColor: '#fefce8',
            border: '1px solid #fef08a',
            borderRadius: '8px',
            padding: '16px',
            margin: '24px 0',
          }}
        >
          <Text
            style={{
              ...textStyles.paragraph,
              color: '#854d0e',
              fontWeight: '600',
              margin: '0 0 8px',
            }}
          >
            Security Details
          </Text>
          {requestedAt && (
            <Text style={{ ...textStyles.small, color: '#a16207', margin: '4px 0' }}>
              <strong>Time:</strong>{' '}
              {requestedAt.toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short',
              })}
            </Text>
          )}
          {ipAddress && (
            <Text style={{ ...textStyles.small, color: '#a16207', margin: '4px 0' }}>
              <strong>IP Address:</strong> {ipAddress}
            </Text>
          )}
          {deviceInfo && (
            <Text style={{ ...textStyles.small, color: '#a16207', margin: '4px 0' }}>
              <strong>Device:</strong> {deviceInfo}
            </Text>
          )}
        </Section>
      )}

      {/* Alternative link */}
      <Text style={textStyles.small}>
        If the button doesn't work, copy and paste this link into your browser:
      </Text>
      <Text
        style={{
          ...textStyles.small,
          wordBreak: 'break-all',
          color: '#5469d4',
        }}
      >
        <Link href={resetUrl} style={{ color: '#5469d4' }}>
          {resetUrl}
        </Link>
      </Text>

      {/* Security notice */}
      <Text style={{ ...textStyles.paragraph, marginTop: '32px' }}>
        For security, this password reset was requested for your account. If you
        didn't make this request, please{' '}
        <Link
          href={baseProps.supportEmail ? `mailto:${baseProps.supportEmail}` : '#'}
          style={{ color: '#5469d4' }}
        >
          contact our support team
        </Link>{' '}
        immediately.
      </Text>

      <Text style={textStyles.paragraph}>
        Best regards,
        <br />
        The {appName} Security Team
      </Text>
    </BaseEmail>
  );
}

/**
 * Get subject line for password reset email
 */
export function getPasswordResetSubject(props: PasswordResetEmailProps): string {
  return `Reset your ${props.appName || 'PhilJS'} password`;
}

export default PasswordResetEmail;
