import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
  Img,
  Preview,
  Font,
} from '@react-email/components';

/**
 * Base email template props
 */
export interface BaseEmailProps {
  /** Email preview text (shown in email list) */
  preview?: string;
  /** Company/app name */
  appName?: string;
  /** Logo URL */
  logoUrl?: string;
  /** Logo alt text */
  logoAlt?: string;
  /** Footer text */
  footerText?: string;
  /** Unsubscribe URL */
  unsubscribeUrl?: string;
  /** Support email */
  supportEmail?: string;
  /** Website URL */
  websiteUrl?: string;
  /** Custom CSS */
  customStyles?: React.CSSProperties;
  /** Children content */
  children: React.ReactNode;
}

/**
 * Default styles
 */
const defaultStyles = {
  body: {
    backgroundColor: '#f6f9fc',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
    margin: 0,
    padding: 0,
  } as React.CSSProperties,

  container: {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
    maxWidth: '600px',
  } as React.CSSProperties,

  header: {
    padding: '32px 48px 0',
    textAlign: 'center' as const,
  } as React.CSSProperties,

  logo: {
    margin: '0 auto',
  } as React.CSSProperties,

  content: {
    padding: '0 48px',
  } as React.CSSProperties,

  footer: {
    padding: '0 48px',
    textAlign: 'center' as const,
  } as React.CSSProperties,

  footerText: {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '16px',
    margin: '0',
  } as React.CSSProperties,

  footerLink: {
    color: '#8898aa',
    textDecoration: 'underline',
  } as React.CSSProperties,

  hr: {
    borderColor: '#e6ebf1',
    margin: '20px 0',
  } as React.CSSProperties,
};

/**
 * Base Email Template
 *
 * Provides a consistent layout for all email templates with:
 * - Responsive design
 * - Consistent branding
 * - Unsubscribe footer
 * - Preview text
 */
export function BaseEmail({
  preview,
  appName = 'PhilJS',
  logoUrl,
  logoAlt,
  footerText,
  unsubscribeUrl,
  supportEmail,
  websiteUrl,
  customStyles,
  children,
}: BaseEmailProps): React.ReactElement {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>

      {preview && <Preview>{preview}</Preview>}

      <Body style={{ ...defaultStyles.body, ...customStyles }}>
        <Container style={defaultStyles.container}>
          {/* Header with logo */}
          <Section style={defaultStyles.header}>
            {logoUrl ? (
              <Img
                src={logoUrl}
                alt={logoAlt || appName}
                width={120}
                height={40}
                style={defaultStyles.logo}
              />
            ) : (
              <Text
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#1a1a1a',
                  margin: 0,
                }}
              >
                {appName}
              </Text>
            )}
          </Section>

          {/* Main content */}
          <Section style={defaultStyles.content}>{children}</Section>

          {/* Footer */}
          <Section style={defaultStyles.footer}>
            <Hr style={defaultStyles.hr} />

            {footerText && (
              <Text style={defaultStyles.footerText}>{footerText}</Text>
            )}

            <Text style={defaultStyles.footerText}>
              {websiteUrl && (
                <>
                  <Link href={websiteUrl} style={defaultStyles.footerLink}>
                    {appName}
                  </Link>
                  {' | '}
                </>
              )}

              {supportEmail && (
                <>
                  <Link
                    href={`mailto:${supportEmail}`}
                    style={defaultStyles.footerLink}
                  >
                    Contact Support
                  </Link>
                  {unsubscribeUrl && ' | '}
                </>
              )}

              {unsubscribeUrl && (
                <Link href={unsubscribeUrl} style={defaultStyles.footerLink}>
                  Unsubscribe
                </Link>
              )}
            </Text>

            <Text style={{ ...defaultStyles.footerText, marginTop: '16px' }}>
              &copy; {new Date().getFullYear()} {appName}. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

/**
 * Common text styles for use in templates
 */
export const textStyles = {
  heading: {
    color: '#1a1a1a',
    fontSize: '24px',
    fontWeight: 'bold',
    lineHeight: '32px',
    margin: '32px 0 16px',
  } as React.CSSProperties,

  subheading: {
    color: '#1a1a1a',
    fontSize: '18px',
    fontWeight: '600',
    lineHeight: '24px',
    margin: '24px 0 12px',
  } as React.CSSProperties,

  paragraph: {
    color: '#525f7f',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '16px 0',
  } as React.CSSProperties,

  small: {
    color: '#8898aa',
    fontSize: '14px',
    lineHeight: '20px',
    margin: '8px 0',
  } as React.CSSProperties,
};

/**
 * Common button styles for use in templates
 */
export const buttonStyles = {
  primary: {
    backgroundColor: '#5469d4',
    borderRadius: '6px',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '16px',
    fontWeight: '600',
    lineHeight: '100%',
    padding: '12px 24px',
    textAlign: 'center' as const,
    textDecoration: 'none',
  } as React.CSSProperties,

  secondary: {
    backgroundColor: '#ffffff',
    border: '1px solid #e6ebf1',
    borderRadius: '6px',
    color: '#525f7f',
    display: 'inline-block',
    fontSize: '16px',
    fontWeight: '600',
    lineHeight: '100%',
    padding: '12px 24px',
    textAlign: 'center' as const,
    textDecoration: 'none',
  } as React.CSSProperties,

  danger: {
    backgroundColor: '#e53e3e',
    borderRadius: '6px',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '16px',
    fontWeight: '600',
    lineHeight: '100%',
    padding: '12px 24px',
    textAlign: 'center' as const,
    textDecoration: 'none',
  } as React.CSSProperties,
};

export default BaseEmail;
