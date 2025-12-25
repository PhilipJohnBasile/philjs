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
  // Invoice details
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;

  // Company info
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyLogo?: string;

  // Customer info
  customerName: string;
  customerAddress?: string;
  customerEmail?: string;
  customerPhone?: string;

  // Items
  items: InvoiceItem[];

  // Totals
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  total: number;

  // Additional
  notes?: string;
  terms?: string;
  paymentInstructions?: string;
  currency?: string;
}

/**
 * Generate HTML for invoice template
 */
export function generateInvoiceHtml(data: InvoiceData): string {
  const currency = data.currency || '$';

  const itemsHtml = data.items.map(item => `
    <tr>
      <td>${item.description}</td>
      <td class="text-center">${item.quantity}</td>
      <td class="text-right">${currency}${item.unitPrice.toFixed(2)}</td>
      <td class="text-right">${currency}${(item.total || item.quantity * item.unitPrice).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${data.invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #333;
      background: #fff;
      padding: 40px;
    }

    .invoice-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #3b82f6;
    }

    .company-info h1 {
      font-size: 28px;
      color: #3b82f6;
      margin-bottom: 10px;
    }

    .company-info p {
      color: #666;
      margin-bottom: 4px;
    }

    .invoice-details {
      text-align: right;
    }

    .invoice-details h2 {
      font-size: 32px;
      color: #333;
      margin-bottom: 10px;
    }

    .invoice-details p {
      margin-bottom: 4px;
    }

    .invoice-details strong {
      color: #3b82f6;
    }

    .addresses {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }

    .address-box {
      width: 45%;
    }

    .address-box h3 {
      font-size: 12px;
      text-transform: uppercase;
      color: #999;
      margin-bottom: 10px;
      letter-spacing: 1px;
    }

    .address-box p {
      margin-bottom: 4px;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }

    .items-table th {
      background: #f8fafc;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 12px;
      color: #666;
      border-bottom: 2px solid #e2e8f0;
    }

    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
    }

    .text-center {
      text-align: center;
    }

    .text-right {
      text-align: right;
    }

    .totals {
      width: 300px;
      margin-left: auto;
      margin-bottom: 40px;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .totals-row.total {
      font-size: 18px;
      font-weight: 700;
      color: #3b82f6;
      border-bottom: 2px solid #3b82f6;
      padding: 12px 0;
    }

    .notes {
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .notes h4 {
      font-size: 12px;
      text-transform: uppercase;
      color: #999;
      margin-bottom: 10px;
    }

    .footer {
      text-align: center;
      color: #999;
      font-size: 12px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="invoice-header">
    <div class="company-info">
      ${data.companyLogo ? `<img src="${data.companyLogo}" alt="${data.companyName}" style="max-height: 60px; margin-bottom: 10px;">` : ''}
      <h1>${data.companyName}</h1>
      ${data.companyAddress ? `<p>${data.companyAddress}</p>` : ''}
      ${data.companyPhone ? `<p>${data.companyPhone}</p>` : ''}
      ${data.companyEmail ? `<p>${data.companyEmail}</p>` : ''}
    </div>
    <div class="invoice-details">
      <h2>INVOICE</h2>
      <p><strong>#${data.invoiceNumber}</strong></p>
      <p>Date: ${data.invoiceDate}</p>
      ${data.dueDate ? `<p>Due: ${data.dueDate}</p>` : ''}
    </div>
  </div>

  <div class="addresses">
    <div class="address-box">
      <h3>Bill To</h3>
      <p><strong>${data.customerName}</strong></p>
      ${data.customerAddress ? `<p>${data.customerAddress}</p>` : ''}
      ${data.customerEmail ? `<p>${data.customerEmail}</p>` : ''}
      ${data.customerPhone ? `<p>${data.customerPhone}</p>` : ''}
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>Description</th>
        <th class="text-center">Qty</th>
        <th class="text-right">Unit Price</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div class="totals">
    ${data.subtotal !== undefined ? `
      <div class="totals-row">
        <span>Subtotal</span>
        <span>${currency}${data.subtotal.toFixed(2)}</span>
      </div>
    ` : ''}
    ${data.discount ? `
      <div class="totals-row">
        <span>Discount</span>
        <span>-${currency}${data.discount.toFixed(2)}</span>
      </div>
    ` : ''}
    ${data.taxRate !== undefined ? `
      <div class="totals-row">
        <span>Tax (${data.taxRate}%)</span>
        <span>${currency}${(data.taxAmount || 0).toFixed(2)}</span>
      </div>
    ` : ''}
    <div class="totals-row total">
      <span>Total</span>
      <span>${currency}${data.total.toFixed(2)}</span>
    </div>
  </div>

  ${data.notes ? `
    <div class="notes">
      <h4>Notes</h4>
      <p>${data.notes}</p>
    </div>
  ` : ''}

  ${data.paymentInstructions ? `
    <div class="notes">
      <h4>Payment Instructions</h4>
      <p>${data.paymentInstructions}</p>
    </div>
  ` : ''}

  ${data.terms ? `
    <div class="notes">
      <h4>Terms & Conditions</h4>
      <p>${data.terms}</p>
    </div>
  ` : ''}

  <div class="footer">
    <p>Thank you for your business!</p>
  </div>
</body>
</html>
  `;
}

export default generateInvoiceHtml;
