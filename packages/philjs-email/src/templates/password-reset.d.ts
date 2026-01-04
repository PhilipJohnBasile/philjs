/**
 * Password reset email template
 */
export interface PasswordResetEmailProps {
    resetUrl: string;
    expiresIn?: string;
}
export declare function PasswordResetEmail(_props: PasswordResetEmailProps): string;
export declare function getPasswordResetSubject(): string;
//# sourceMappingURL=password-reset.d.ts.map