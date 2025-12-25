/**
 * Report Template for PDF Generation
 */

export interface ReportSection {
  title: string;
  content: string;
  type?: 'text' | 'chart' | 'table' | 'image';
  data?: any;
}

export interface ReportData {
  // Report details
  title: string;
  subtitle?: string;
  reportDate: string;
  reportNumber?: string;

  // Author info
  author?: string;
  authorTitle?: string;
  department?: string;

  // Company info
  companyName?: string;
  companyLogo?: string;

  // Content
  executiveSummary?: string;
  sections: ReportSection[];

  // Table of contents
  showTableOfContents?: boolean;

  // Footer
  confidential?: boolean;
  footerText?: string;
}

/**
 * Generate HTML for report template
 */
export function generateReportHtml(data: ReportData): string {
  const sectionsHtml = data.sections.map((section, index) => {
    let contentHtml = '';

    switch (section.type) {
      case 'table':
        if (section.data?.headers && section.data?.rows) {
          const headersHtml = section.data.headers
            .map((h: string) => `<th>${h}</th>`)
            .join('');
          const rowsHtml = section.data.rows
            .map((row: string[]) => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`)
            .join('');
          contentHtml = `
            <table class="data-table">
              <thead><tr>${headersHtml}</tr></thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          `;
        }
        break;

      case 'image':
        if (section.data?.src) {
          contentHtml = `
            <figure>
              <img src="${section.data.src}" alt="${section.data.alt || section.title}" style="max-width: 100%;">
              ${section.data.caption ? `<figcaption>${section.data.caption}</figcaption>` : ''}
            </figure>
          `;
        }
        break;

      case 'chart':
        // Placeholder for chart - in real implementation, this would render a chart
        contentHtml = `
          <div class="chart-placeholder">
            <p>[Chart: ${section.title}]</p>
            ${section.content ? `<p>${section.content}</p>` : ''}
          </div>
        `;
        break;

      case 'text':
      default:
        contentHtml = section.content
          .split('\n\n')
          .map(p => `<p>${p}</p>`)
          .join('');
        break;
    }

    return `
      <section class="report-section" id="section-${index + 1}">
        <h2>${index + 1}. ${section.title}</h2>
        ${contentHtml}
      </section>
    `;
  }).join('');

  const tocHtml = data.showTableOfContents ? `
    <div class="table-of-contents">
      <h2>Table of Contents</h2>
      <ul>
        ${data.executiveSummary ? '<li><a href="#executive-summary">Executive Summary</a></li>' : ''}
        ${data.sections.map((section, index) => `
          <li><a href="#section-${index + 1}">${index + 1}. ${section.title}</a></li>
        `).join('')}
      </ul>
    </div>
    <div class="page-break"></div>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #333;
      background: #fff;
      padding: 60px;
    }

    .cover-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 60px;
    }

    .cover-page .company-logo {
      max-height: 80px;
      margin-bottom: 40px;
    }

    .cover-page h1 {
      font-size: 36pt;
      color: #1e3a5f;
      margin-bottom: 20px;
      font-weight: 700;
    }

    .cover-page .subtitle {
      font-size: 18pt;
      color: #666;
      margin-bottom: 40px;
    }

    .cover-page .meta {
      margin-top: 60px;
      color: #666;
    }

    .cover-page .meta p {
      margin-bottom: 8px;
    }

    .page-break {
      page-break-after: always;
    }

    .table-of-contents {
      margin-bottom: 40px;
    }

    .table-of-contents h2 {
      font-size: 18pt;
      color: #1e3a5f;
      margin-bottom: 20px;
      border-bottom: 2px solid #1e3a5f;
      padding-bottom: 10px;
    }

    .table-of-contents ul {
      list-style: none;
    }

    .table-of-contents li {
      margin-bottom: 10px;
      padding-left: 20px;
    }

    .table-of-contents a {
      color: #333;
      text-decoration: none;
    }

    .table-of-contents a:hover {
      color: #1e3a5f;
    }

    .executive-summary {
      background: #f8fafc;
      padding: 30px;
      border-left: 4px solid #1e3a5f;
      margin-bottom: 40px;
    }

    .executive-summary h2 {
      font-size: 16pt;
      color: #1e3a5f;
      margin-bottom: 15px;
    }

    .report-section {
      margin-bottom: 40px;
    }

    .report-section h2 {
      font-size: 16pt;
      color: #1e3a5f;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e2e8f0;
    }

    .report-section p {
      margin-bottom: 15px;
      text-align: justify;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }

    .data-table th {
      background: #1e3a5f;
      color: #fff;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }

    .data-table td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
    }

    .data-table tr:nth-child(even) {
      background: #f8fafc;
    }

    .chart-placeholder {
      background: #f8fafc;
      border: 2px dashed #ccc;
      padding: 40px;
      text-align: center;
      margin: 20px 0;
      border-radius: 8px;
    }

    figure {
      margin: 20px 0;
    }

    figcaption {
      font-style: italic;
      color: #666;
      text-align: center;
      margin-top: 10px;
    }

    .confidential-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #dc2626;
      color: #fff;
      text-align: center;
      padding: 5px;
      font-size: 10pt;
      font-weight: 700;
      letter-spacing: 2px;
    }

    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #666;
      font-size: 10pt;
    }

    @media print {
      body {
        padding: 40px;
      }

      .page-break {
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  ${data.confidential ? '<div class="confidential-banner">CONFIDENTIAL</div>' : ''}

  <div class="cover-page">
    ${data.companyLogo ? `<img src="${data.companyLogo}" alt="${data.companyName}" class="company-logo">` : ''}
    ${data.companyName ? `<p style="font-size: 14pt; color: #1e3a5f; margin-bottom: 20px;">${data.companyName}</p>` : ''}
    <h1>${data.title}</h1>
    ${data.subtitle ? `<p class="subtitle">${data.subtitle}</p>` : ''}
    <div class="meta">
      ${data.reportNumber ? `<p><strong>Report #:</strong> ${data.reportNumber}</p>` : ''}
      <p><strong>Date:</strong> ${data.reportDate}</p>
      ${data.author ? `<p><strong>Prepared by:</strong> ${data.author}${data.authorTitle ? `, ${data.authorTitle}` : ''}</p>` : ''}
      ${data.department ? `<p><strong>Department:</strong> ${data.department}</p>` : ''}
    </div>
  </div>

  <div class="page-break"></div>

  ${tocHtml}

  ${data.executiveSummary ? `
    <div class="executive-summary" id="executive-summary">
      <h2>Executive Summary</h2>
      ${data.executiveSummary.split('\n\n').map(p => `<p>${p}</p>`).join('')}
    </div>
  ` : ''}

  ${sectionsHtml}

  <div class="footer">
    ${data.footerText || `${data.companyName || ''} - ${data.title} - ${data.reportDate}`}
  </div>
</body>
</html>
  `;
}

export default generateReportHtml;
