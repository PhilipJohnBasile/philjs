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
    title: string;
    subtitle?: string;
    reportDate: string;
    reportNumber?: string;
    author?: string;
    authorTitle?: string;
    department?: string;
    companyName?: string;
    companyLogo?: string;
    executiveSummary?: string;
    sections: ReportSection[];
    showTableOfContents?: boolean;
    confidential?: boolean;
    footerText?: string;
}
/**
 * Generate HTML for report template
 */
export declare function generateReportHtml(data: ReportData): string;
export default generateReportHtml;
//# sourceMappingURL=report.d.ts.map