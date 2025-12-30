/**
 * Password reset email template
 */

export interface PasswordResetEmailProps {
  resetUrl: string;
  expiresIn?: string;
}

export function PasswordResetEmail(_props: PasswordResetEmailProps): string {
  return '';
}

export function getPasswordResetSubject(): string {
  return 'Reset your password';
}
