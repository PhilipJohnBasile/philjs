/**
 * Invoice Template for PDF Generation
 */
export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total?: number;
}
export interface InvoiceData {
    invoiceNumber: string;
    invoiceDate: string;
    dueDate?: string;
    companyName: string;
    companyAddress?: string;
    companyPhone?: string;
    companyEmail?: string;
    companyLogo?: string;
    customerName: string;
    customerAddress?: string;
    customerEmail?: string;
    customerPhone?: string;
    items: InvoiceItem[];
    subtotal?: number;
    taxRate?: number;
    taxAmount?: number;
    discount?: number;
    total: number;
    notes?: string;
    terms?: string;
    paymentInstructions?: string;
    currency?: string;
}
/**
 * Generate HTML for invoice template
 */
export declare function generateInvoiceHtml(data: InvoiceData): string;
export default generateInvoiceHtml;
//# sourceMappingURL=invoice.d.ts.map