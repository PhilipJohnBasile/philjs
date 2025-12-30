/**
 * Welcome email template
 */

export interface WelcomeEmailProps {
  name: string;
  verificationUrl?: string;
}

export function WelcomeEmail(_props: WelcomeEmailProps): string {
  return '';
}

export function getWelcomeSubject(name: string): string {
  return `Welcome, ${name}!`;
}
