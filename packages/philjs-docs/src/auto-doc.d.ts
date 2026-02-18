/**
 * Autonomous Documentation Generator.
 * Reads code, understands intent, and writes/updates Markdown docs.
 *
 * @param entryPoint - The main entry file to analyze.
 * @returns Status of the generation and list of updated files.
 */
export declare function generateDocs(entryPoint: string): Promise<{
    status: string;
    files: string[];
}>;
