/**
 * Bundle Analysis Tool
 */
import * as fs from "fs/promises";
import * as path from "path";
import * as pc from "picocolors";
export async function analyze() {
    const distPath = path.join(process.cwd(), "dist");
    try {
        await fs.access(distPath);
    }
    catch {
        console.error(pc.red("No build found. Run `philjs build` first."));
        return;
    }
    const stats = await analyzeBundle(distPath);
    // Print summary
    console.log(pc.bold("\n📊 Bundle Analysis\n"));
    console.log(pc.dim("─".repeat(70)));
    console.log(pc.cyan("\nJavaScript:") +
        `  ${formatSize(stats.js.total)}` +
        pc.dim(` (${stats.js.count} files)`));
    for (const [name, size] of Object.entries(stats.js.files).slice(0, 10)) {
        const percent = ((size / stats.js.total) * 100).toFixed(1);
        console.log(pc.dim("  ├─ ") +
            name.padEnd(40) +
            formatSize(size).padStart(12) +
            pc.dim(` ${percent}%`));
    }
    console.log(pc.cyan("\nCSS:") +
        `       ${formatSize(stats.css.total)}` +
        pc.dim(` (${stats.css.count} files)`));
    console.log(pc.cyan("\nImages:") +
        `    ${formatSize(stats.images.total)}` +
        pc.dim(` (${stats.images.count} files)`));
    console.log(pc.cyan("\nFonts:") +
        `     ${formatSize(stats.fonts.total)}` +
        pc.dim(` (${stats.fonts.count} files)`));
    console.log(pc.dim("\n" + "─".repeat(70)));
    console.log(pc.bold("\nTotal:") + `    ${formatSize(stats.total)}` + "\n");
    // Performance recommendations
    console.log(pc.bold("💡 Recommendations:\n"));
    if (stats.js.total > 200 * 1024) {
        console.log(pc.yellow("  ⚠ JS bundle is large. Consider code splitting."));
    }
    if (stats.images.total > 500 * 1024) {
        console.log(pc.yellow("  ⚠ Large images detected. Consider compression."));
    }
    if (stats.fonts.total > 100 * 1024) {
        console.log(pc.yellow("  ⚠ Font files are large. Consider subsetting."));
    }
    if (stats.js.total < 200 * 1024 &&
        stats.css.total < 50 * 1024 &&
        stats.total < 500 * 1024) {
        console.log(pc.green("  ✓ Bundle size is excellent!"));
    }
    console.log();
}
async function analyzeBundle(dir) {
    const stats = {
        js: { total: 0, count: 0, files: {} },
        css: { total: 0, count: 0, files: {} },
        images: { total: 0, count: 0, files: {} },
        fonts: { total: 0, count: 0, files: {} },
        total: 0,
    };
    async function scan(currentDir) {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory()) {
                await scan(fullPath);
            }
            else if (entry.isFile()) {
                const fileStats = await fs.stat(fullPath);
                const ext = path.extname(entry.name);
                const relativePath = path.relative(dir, fullPath);
                stats.total += fileStats.size;
                if (ext === ".js" || ext === ".mjs") {
                    stats.js.total += fileStats.size;
                    stats.js.count++;
                    stats.js.files[relativePath] = fileStats.size;
                }
                else if (ext === ".css") {
                    stats.css.total += fileStats.size;
                    stats.css.count++;
                    stats.css.files[relativePath] = fileStats.size;
                }
                else if ([".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"].includes(ext)) {
                    stats.images.total += fileStats.size;
                    stats.images.count++;
                    stats.images.files[relativePath] = fileStats.size;
                }
                else if ([".woff", ".woff2", ".ttf", ".otf"].includes(ext)) {
                    stats.fonts.total += fileStats.size;
                    stats.fonts.count++;
                    stats.fonts.files[relativePath] = fileStats.size;
                }
            }
        }
    }
    await scan(dir);
    // Sort files by size (largest first)
    for (const category of [stats.js, stats.css, stats.images, stats.fonts]) {
        category.files = Object.fromEntries(Object.entries(category.files).sort(([, a], [, b]) => b - a));
    }
    return stats;
}
function formatSize(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
//# sourceMappingURL=analyze.js.map