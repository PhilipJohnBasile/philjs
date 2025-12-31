/**
 * Certificate Template for PDF Generation
 */
export interface CertificateData {
    title: string;
    subtitle?: string;
    certificateNumber?: string;
    issueDate: string;
    expiryDate?: string;
    recipientName: string;
    recipientTitle?: string;
    achievement: string;
    description?: string;
    course?: string;
    hours?: number;
    grade?: string;
    score?: number;
    organizationName: string;
    organizationLogo?: string;
    signatures?: Array<{
        name: string;
        title: string;
        signature?: string;
    }>;
    theme?: 'classic' | 'modern' | 'elegant' | 'corporate';
    borderStyle?: 'ornate' | 'simple' | 'none';
    primaryColor?: string;
    secondaryColor?: string;
}
/**
 * Generate HTML for certificate template
 */
export declare function generateCertificateHtml(data: CertificateData): string;
export default generateCertificateHtml;
//# sourceMappingURL=certificate.d.ts.map