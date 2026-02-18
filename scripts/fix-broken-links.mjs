
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const brokenLinksPath = path.join(process.cwd(), 'broken_links.txt');
const content = fs.readFileSync(brokenLinksPath, 'utf-8');

// Regex to find the missing file paths
// Format: [ERROR] file:///C:/Users/Phili/Git/philjs/docs/philjs-book/src/patterns/game-dev.md | Cannot find file
const regex = /\[ERROR\] file:\/\/\/(.*?) \| Cannot find file/g;

let match;
let count = 0;

while ((match = regex.exec(content)) !== null) {
    // Decode URI components (e.g. %20)
    let filePath = decodeURIComponent(match[1]);

    // Strip anchor fragments (e.g. #section)
    filePath = filePath.split('#')[0];

    // Normalize path for Windows
    const absolutePath = path.normalize(filePath);

    if (!fs.existsSync(absolutePath)) {
        const dir = path.dirname(absolutePath);
        const filename = path.basename(absolutePath, '.md');

        // Create directory if it doesn't exist
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Create a title from the filename (e.g., "game-dev" -> "Game Dev")
        const title = filename
            .split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        const fileContent = `# ${title}\n\n> [!NOTE]\n> This chapter is currently under development. Check back soon for updates.\n\n## Overview\n\nContent coming soon.\n`;

        fs.writeFileSync(absolutePath, fileContent);
        console.log(`Created stub: ${absolutePath}`);
        count++;
    }
}

console.log(`\nSuccessfully created ${count} missing files.`);
