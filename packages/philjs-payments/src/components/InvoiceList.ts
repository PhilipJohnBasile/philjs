/**
 * InvoiceList Component
 * Displays a list of invoices for a customer
 */

export interface InvoiceListProps {
  customerId?: string | undefined;
  limit?: number | undefined;
  onInvoiceClick?: ((invoiceId: string) => void) | undefined;
  showDownloadButton?: boolean | undefined;
}

/**
 * InvoiceList component placeholder
 */
export const InvoiceList = {
  displayName: 'InvoiceList',
} as const;
