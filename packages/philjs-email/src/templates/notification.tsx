import * as React from 'react';
import { Text, Button, Section, Link, Hr } from '@react-email/components';
import { BaseEmail, textStyles, buttonStyles } from './base';
import type { BaseEmailProps } from './base';

/**
 * Notification type variants
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * Notification email template props
 */
export interface NotificationEmailProps extends Omit<BaseEmailProps, 'children'> {
  /** User's name (optional) */
  userName?: string;
  /** Notification title */
  title: string;
  /** Notification message */
  message: string;
  /** Notification type for styling */
  type?: NotificationType;
  /** Call-to-action URL */
  actionUrl?: string;
  /** Call-to-action text */
  actionText?: string;
  /** Secondary action URL */
  secondaryActionUrl?: string;
  /** Secondary action text */
  secondaryActionText?: string;
  /** Additional details */
  details?: Array<{
    label: string;
    value: string;
  }>;
  /** Timestamp */
  timestamp?: Date;
  /** Category/tag */
  category?: string;
  /** Custom icon URL */
  iconUrl?: string;
}

/**
 * Type-based colors
 */
const typeColors: Record<
  NotificationType,
  { bg: string; border: string; text: string; icon: string }
> = {
  info: {
    bg: '#eff6ff',
    border: '#bfdbfe',
    text: '#1e40af',
    icon: 'ℹ️',
  },
  success: {
    bg: '#f0fdf4',
    border: '#bbf7d0',
    text: '#166534',
    icon: '✅',
  },
  warning: {
    bg: '#fefce8',
    border: '#fef08a',
    text: '#854d0e',
    icon: '⚠️',
  },
  error: {
    bg: '#fef2f2',
    border: '#fecaca',
    text: '#991b1b',
    icon: '❌',
  },
};

/**
 * Notification Email Template
 *
 * Generic notification template suitable for:
 * - System notifications
 * - Activity alerts
 * - Status updates
 * - Action required notices
 */
export function NotificationEmail({
  userName,
  title,
  message,
  type = 'info',
  actionUrl,
  actionText,
  secondaryActionUrl,
  secondaryActionText,
  details,
  timestamp,
  category,
  iconUrl,
  appName = 'PhilJS',
  ...baseProps
}: NotificationEmailProps): React.ReactElement {
  const previewText = `${title} - ${message.substring(0, 50)}...`;
  const colors = typeColors[type];

  return (
    <BaseEmail
      preview={previewText}
      appName={appName}
      {...baseProps}
    >
      {/* Category badge */}
      {category && (
        <Section style={{ marginBottom: '16px' }}>
          <Text
            style={{
              backgroundColor: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: '16px',
              color: colors.text,
              display: 'inline-block',
              fontSize: '12px',
              fontWeight: '600',
              padding: '4px 12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {category}
          </Text>
        </Section>
      )}

      {/* Greeting */}
      {userName && <Text style={textStyles.paragraph}>Hi {userName},</Text>}

      {/* Notification box */}
      <Section
        style={{
          backgroundColor: colors.bg,
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          padding: '20px',
          margin: '24px 0',
        }}
      >
        {/* Title with icon */}
        <Text
          style={{
            color: colors.text,
            fontSize: '18px',
            fontWeight: '600',
            lineHeight: '24px',
            margin: '0 0 12px',
          }}
        >
          {iconUrl ? (
            <img
              src={iconUrl}
              alt=""
              style={{
                width: '20px',
                height: '20px',
                marginRight: '8px',
                verticalAlign: 'middle',
              }}
            />
          ) : (
            <span style={{ marginRight: '8px' }}>{colors.icon}</span>
          )}
          {title}
        </Text>

        {/* Message */}
        <Text
          style={{
            color: colors.text,
            fontSize: '14px',
            lineHeight: '22px',
            margin: '0',
          }}
        >
          {message}
        </Text>

        {/* Timestamp */}
        {timestamp && (
          <Text
            style={{
              color: colors.text,
              fontSize: '12px',
              opacity: 0.7,
              margin: '12px 0 0',
            }}
          >
            {timestamp.toLocaleString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        )}
      </Section>

      {/* Details section */}
      {details && details.length > 0 && (
        <Section
          style={{
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            padding: '16px',
            margin: '24px 0',
          }}
        >
          <Text
            style={{
              ...textStyles.small,
              fontWeight: '600',
              margin: '0 0 12px',
            }}
          >
            Details
          </Text>
          {details.map((detail, index) => (
            <Section
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom:
                  index < details.length - 1 ? '1px solid #e5e7eb' : 'none',
                padding: '8px 0',
              }}
            >
              <Text
                style={{
                  ...textStyles.small,
                  color: '#6b7280',
                  margin: '0',
                }}
              >
                {detail.label}
              </Text>
              <Text
                style={{
                  ...textStyles.small,
                  color: '#1f2937',
                  fontWeight: '500',
                  margin: '0',
                  textAlign: 'right',
                }}
              >
                {detail.value}
              </Text>
            </Section>
          ))}
        </Section>
      )}

      {/* Action buttons */}
      {(actionUrl || secondaryActionUrl) && (
        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          {actionUrl && (
            <Button
              href={actionUrl}
              style={{
                ...buttonStyles.primary,
                marginRight: secondaryActionUrl ? '12px' : '0',
              }}
            >
              {actionText || 'View Details'}
            </Button>
          )}
          {secondaryActionUrl && (
            <Button href={secondaryActionUrl} style={buttonStyles.secondary}>
              {secondaryActionText || 'Learn More'}
            </Button>
          )}
        </Section>
      )}

      {/* Footer message */}
      <Hr style={{ borderColor: '#e6ebf1', margin: '32px 0 16px' }} />

      <Text style={textStyles.small}>
        This is an automated notification from {appName}. If you have questions,{' '}
        <Link
          href={baseProps.supportEmail ? `mailto:${baseProps.supportEmail}` : '#'}
          style={{ color: '#5469d4' }}
        >
          contact support
        </Link>
        .
      </Text>
    </BaseEmail>
  );
}

/**
 * Get subject line for notification email
 */
export function getNotificationSubject(props: NotificationEmailProps): string {
  const prefix =
    {
      info: '',
      success: '[Success] ',
      warning: '[Action Required] ',
      error: '[Important] ',
    }[props.type || 'info'] || '';

  return `${prefix}${props.title}`;
}

export default NotificationEmail;
