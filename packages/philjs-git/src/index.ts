
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export async function getGitStatus() {
    const { stdout } = await execAsync('git status --porcelain');
    // @ts-ignore
    return stdout.split('\n').filter(Boolean).map((line: string) => {
        const [status, file] = line.trim().split(/\s+/);
        return { status, file };
    });
}

export async function getBranch() {
    const { stdout } = await execAsync('git branch --show-current');
    // @ts-ignore
    return stdout.trim();
}
