export interface Vulnerability {
    severity: 'high' | 'medium' | 'low';
    file: string;
    description: string;
    autoPatched: boolean;
}
/**
 * Self-Patching Security Scanner.
 * Detects vulnerabilities and automatically applies code fixes.
 *
 * @returns A list of detected vulnerabilities and their patch status.
 */
export declare function scanAndPatch(): Promise<Vulnerability[]>;
