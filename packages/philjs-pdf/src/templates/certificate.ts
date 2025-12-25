/**
 * Certificate Template for PDF Generation
 */

export interface CertificateData {
  // Certificate details
  title: string;
  subtitle?: string;
  certificateNumber?: string;
  issueDate: string;
  expiryDate?: string;

  // Recipient info
  recipientName: string;
  recipientTitle?: string;

  // Achievement
  achievement: string;
  description?: string;
  course?: string;
  hours?: number;
  grade?: string;
  score?: number;

  // Organization
  organizationName: string;
  organizationLogo?: string;

  // Signatures
  signatures?: Array<{
    name: string;
    title: string;
    signature?: string; // Image URL
  }>;

  // Styling
  theme?: 'classic' | 'modern' | 'elegant' | 'corporate';
  borderStyle?: 'ornate' | 'simple' | 'none';
  primaryColor?: string;
  secondaryColor?: string;
}

/**
 * Generate HTML for certificate template
 */
export function generateCertificateHtml(data: CertificateData): string {
  const theme = data.theme || 'classic';
  const primaryColor = data.primaryColor || getThemeColors(theme).primary;
  const secondaryColor = data.secondaryColor || getThemeColors(theme).secondary;
  const borderStyle = data.borderStyle || 'ornate';

  const signaturesHtml = data.signatures?.map(sig => `
    <div class="signature">
      ${sig.signature ? `<img src="${sig.signature}" alt="${sig.name}" class="signature-image">` : '<div class="signature-line"></div>'}
      <p class="signature-name">${sig.name}</p>
      <p class="signature-title">${sig.title}</p>
    </div>
  `).join('') || '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate - ${data.recipientName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Great+Vibes&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Playfair Display', Georgia, serif;
      background: #fff;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }

    .certificate {
      width: 900px;
      min-height: 650px;
      background: linear-gradient(135deg, #fefefe 0%, #f5f5f5 100%);
      position: relative;
      padding: 60px;
      ${borderStyle === 'ornate' ? `
        border: 3px solid ${primaryColor};
        box-shadow:
          inset 0 0 0 1px ${primaryColor},
          inset 0 0 0 4px #fff,
          inset 0 0 0 5px ${primaryColor},
          0 10px 30px rgba(0,0,0,0.1);
      ` : borderStyle === 'simple' ? `
        border: 2px solid ${primaryColor};
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      ` : `
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      `}
    }

    .certificate::before {
      ${borderStyle === 'ornate' ? `
        content: '';
        position: absolute;
        top: 15px;
        left: 15px;
        right: 15px;
        bottom: 15px;
        border: 1px solid ${secondaryColor};
        pointer-events: none;
      ` : ''}
    }

    .corner-decoration {
      position: absolute;
      width: 60px;
      height: 60px;
      ${borderStyle === 'ornate' ? `
        border: 2px solid ${secondaryColor};
      ` : 'display: none;'}
    }

    .corner-decoration.top-left {
      top: 25px;
      left: 25px;
      border-right: none;
      border-bottom: none;
    }

    .corner-decoration.top-right {
      top: 25px;
      right: 25px;
      border-left: none;
      border-bottom: none;
    }

    .corner-decoration.bottom-left {
      bottom: 25px;
      left: 25px;
      border-right: none;
      border-top: none;
    }

    .corner-decoration.bottom-right {
      bottom: 25px;
      right: 25px;
      border-left: none;
      border-top: none;
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
    }

    .logo {
      max-height: 80px;
      margin-bottom: 15px;
    }

    .organization-name {
      font-size: 14pt;
      color: ${primaryColor};
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: 20px;
    }

    .title {
      font-family: 'Cinzel', serif;
      font-size: 42pt;
      color: ${primaryColor};
      letter-spacing: 8px;
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .subtitle {
      font-family: 'Great Vibes', cursive;
      font-size: 24pt;
      color: ${secondaryColor};
      margin-bottom: 20px;
    }

    .presented-to {
      font-size: 12pt;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 4px;
      margin-bottom: 15px;
    }

    .recipient-name {
      font-family: 'Great Vibes', cursive;
      font-size: 48pt;
      color: ${primaryColor};
      margin-bottom: 20px;
      line-height: 1.2;
    }

    .recipient-title {
      font-size: 14pt;
      color: #666;
      font-style: italic;
      margin-bottom: 25px;
    }

    .achievement {
      font-size: 14pt;
      color: #333;
      max-width: 700px;
      margin: 0 auto 15px;
      line-height: 1.8;
    }

    .achievement strong {
      color: ${primaryColor};
    }

    .description {
      font-size: 12pt;
      color: #666;
      max-width: 600px;
      margin: 0 auto 25px;
      font-style: italic;
    }

    .details {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }

    .detail-item {
      text-align: center;
    }

    .detail-label {
      font-size: 10pt;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 5px;
    }

    .detail-value {
      font-size: 14pt;
      color: ${primaryColor};
      font-weight: 600;
    }

    .signatures-container {
      display: flex;
      justify-content: center;
      gap: 80px;
      margin-top: 40px;
    }

    .signature {
      text-align: center;
      min-width: 180px;
    }

    .signature-image {
      max-height: 50px;
      margin-bottom: 5px;
    }

    .signature-line {
      width: 180px;
      height: 1px;
      background: #333;
      margin: 20px auto 10px;
    }

    .signature-name {
      font-size: 12pt;
      color: #333;
      font-weight: 600;
    }

    .signature-title {
      font-size: 10pt;
      color: #666;
    }

    .footer {
      position: absolute;
      bottom: 30px;
      left: 60px;
      right: 60px;
      display: flex;
      justify-content: space-between;
      font-size: 10pt;
      color: #999;
    }

    .certificate-number {
      font-family: 'Courier New', monospace;
    }

    @media print {
      body {
        padding: 0;
      }

      .certificate {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="corner-decoration top-left"></div>
    <div class="corner-decoration top-right"></div>
    <div class="corner-decoration bottom-left"></div>
    <div class="corner-decoration bottom-right"></div>

    <div class="header">
      ${data.organizationLogo ? `<img src="${data.organizationLogo}" alt="${data.organizationName}" class="logo">` : ''}
      <p class="organization-name">${data.organizationName}</p>
      <h1 class="title">${data.title}</h1>
      ${data.subtitle ? `<p class="subtitle">${data.subtitle}</p>` : ''}
    </div>

    <div style="text-align: center;">
      <p class="presented-to">This is to certify that</p>
      <h2 class="recipient-name">${data.recipientName}</h2>
      ${data.recipientTitle ? `<p class="recipient-title">${data.recipientTitle}</p>` : ''}

      <p class="achievement">${data.achievement}</p>
      ${data.description ? `<p class="description">${data.description}</p>` : ''}

      <div class="details">
        ${data.course ? `
          <div class="detail-item">
            <p class="detail-label">Course</p>
            <p class="detail-value">${data.course}</p>
          </div>
        ` : ''}
        ${data.hours ? `
          <div class="detail-item">
            <p class="detail-label">Hours</p>
            <p class="detail-value">${data.hours}</p>
          </div>
        ` : ''}
        ${data.grade ? `
          <div class="detail-item">
            <p class="detail-label">Grade</p>
            <p class="detail-value">${data.grade}</p>
          </div>
        ` : ''}
        ${data.score !== undefined ? `
          <div class="detail-item">
            <p class="detail-label">Score</p>
            <p class="detail-value">${data.score}%</p>
          </div>
        ` : ''}
        <div class="detail-item">
          <p class="detail-label">Date</p>
          <p class="detail-value">${data.issueDate}</p>
        </div>
      </div>

      ${signaturesHtml ? `
        <div class="signatures-container">
          ${signaturesHtml}
        </div>
      ` : ''}
    </div>

    <div class="footer">
      ${data.certificateNumber ? `<span class="certificate-number">Certificate #: ${data.certificateNumber}</span>` : '<span></span>'}
      ${data.expiryDate ? `<span>Valid until: ${data.expiryDate}</span>` : '<span></span>'}
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Get theme colors
 */
function getThemeColors(theme: string): { primary: string; secondary: string } {
  switch (theme) {
    case 'modern':
      return { primary: '#3b82f6', secondary: '#60a5fa' };
    case 'elegant':
      return { primary: '#7c3aed', secondary: '#a78bfa' };
    case 'corporate':
      return { primary: '#1e3a5f', secondary: '#3b5998' };
    case 'classic':
    default:
      return { primary: '#8b6914', secondary: '#c4a35a' };
  }
}

export default generateCertificateHtml;
