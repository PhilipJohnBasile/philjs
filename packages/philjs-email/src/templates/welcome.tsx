import * as React from 'react';
import { Text, Link, Button, Section } from '@react-email/components';
import { BaseEmail, textStyles, buttonStyles } from './base';
import type { BaseEmailProps } from './base';

/**
 * Welcome email template props
 */
export interface WelcomeEmailProps extends Omit<BaseEmailProps, 'children'> {
  /** User's name */
  userName: string;
  /** User's email */
  userEmail?: string;
  /** Call-to-action URL */
  actionUrl?: string;
  /** Call-to-action text */
  actionText?: string;
  /** Custom welcome message */
  message?: string;
  /** Features to highlight */
  features?: Array<{
    title: string;
    description: string;
  }>;
  /** Getting started steps */
  gettingStarted?: Array<{
    step: number;
    title: string;
    description: string;
  }>;
}

/**
 * Welcome Email Template
 *
 * Sent when a new user signs up. Includes:
 * - Personalized greeting
 * - Key features highlight
 * - Getting started steps
 * - Call-to-action button
 */
export function WelcomeEmail({
  userName,
  userEmail,
  actionUrl,
  actionText = 'Get Started',
  message,
  features,
  gettingStarted,
  appName = 'PhilJS',
  ...baseProps
}: WelcomeEmailProps): React.ReactElement {
  const previewText = `Welcome to ${appName}, ${userName}!`;

  return (
    <BaseEmail
      preview={previewText}
      appName={appName}
      {...baseProps}
    >
      {/* Main heading */}
      <Text style={textStyles.heading}>
        Welcome to {appName}, {userName}! 🎉
      </Text>

      {/* Welcome message */}
      <Text style={textStyles.paragraph}>
        {message ||
          `We're thrilled to have you join us! Your account has been successfully created${
            userEmail ? ` with ${userEmail}` : ''
          }.`}
      </Text>

      {/* Call-to-action button */}
      {actionUrl && (
        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button href={actionUrl} style={buttonStyles.primary}>
            {actionText}
          </Button>
        </Section>
      )}

      {/* Features section */}
      {features && features.length > 0 && (
        <>
          <Text style={textStyles.subheading}>What you can do</Text>
          {features.map((feature, index) => (
            <Section key={index} style={{ marginBottom: '16px' }}>
              <Text
                style={{
                  ...textStyles.paragraph,
                  fontWeight: '600',
                  margin: '0 0 4px',
                }}
              >
                {feature.title}
              </Text>
              <Text
                style={{
                  ...textStyles.small,
                  margin: '0',
                }}
              >
                {feature.description}
              </Text>
            </Section>
          ))}
        </>
      )}

      {/* Getting started section */}
      {gettingStarted && gettingStarted.length > 0 && (
        <>
          <Text style={textStyles.subheading}>Getting Started</Text>
          {gettingStarted.map((step) => (
            <Section
              key={step.step}
              style={{
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'flex-start',
              }}
            >
              <Text
                style={{
                  backgroundColor: '#5469d4',
                  color: '#ffffff',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  lineHeight: '24px',
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  margin: '0 12px 0 0',
                  display: 'inline-block',
                }}
              >
                {step.step}
              </Text>
              <Section style={{ flex: 1 }}>
                <Text
                  style={{
                    ...textStyles.paragraph,
                    fontWeight: '600',
                    margin: '0 0 4px',
                  }}
                >
                  {step.title}
                </Text>
                <Text style={{ ...textStyles.small, margin: '0' }}>
                  {step.description}
                </Text>
              </Section>
            </Section>
          ))}
        </>
      )}

      {/* Help section */}
      <Text style={{ ...textStyles.paragraph, marginTop: '32px' }}>
        If you have any questions, feel free to{' '}
        <Link
          href={baseProps.supportEmail ? `mailto:${baseProps.supportEmail}` : '#'}
          style={{ color: '#5469d4' }}
        >
          reach out to our support team
        </Link>
        . We're here to help!
      </Text>

      <Text style={textStyles.paragraph}>
        Best regards,
        <br />
        The {appName} Team
      </Text>
    </BaseEmail>
  );
}

/**
 * Get subject line for welcome email
 */
export function getWelcomeSubject(props: WelcomeEmailProps): string {
  return `Welcome to ${props.appName || 'PhilJS'}, ${props.userName}!`;
}

export default WelcomeEmail;
