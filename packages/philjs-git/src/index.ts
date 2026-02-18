/**
 * @philjs/git
 *
 * Git utilities for PhilJS - repository operations, status, and automation
 */

import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

// ============================================================================
// Types
// ============================================================================

export interface GitFileStatus {
  status: string;
  file: string;
}

export interface GitCommit {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  date: Date;
  message: string;
}

export interface GitBranch {
  name: string;
  current: boolean;
  remote?: string;
  tracking?: string;
}

export interface GitRemote {
  name: string;
  url: string;
  type: 'fetch' | 'push';
}

export interface GitDiff {
  file: string;
  additions: number;
  deletions: number;
  binary: boolean;
}

// ============================================================================
// Status Operations
// ============================================================================

/**
 * Get current git status (modified, added, deleted files)
 */
export async function getGitStatus(cwd?: string): Promise<GitFileStatus[]> {
  const options = cwd ? { cwd } : {};
  const { stdout } = await execAsync('git status --porcelain', options);
  return stdout
    .split('\n')
    .filter(Boolean)
    .map((line: string) => {
      const status = line.substring(0, 2).trim();
      const file = line.substring(3);
      return { status, file };
    });
}

/**
 * Check if working directory is clean
 */
export async function isClean(cwd?: string): Promise<boolean> {
  const status = await getGitStatus(cwd);
  return status.length === 0;
}

/**
 * Check if current directory is a git repository
 */
export async function isGitRepository(cwd?: string): Promise<boolean> {
  try {
    const options = cwd ? { cwd } : {};
    await execAsync('git rev-parse --git-dir', options);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Branch Operations
// ============================================================================

/**
 * Get current branch name
 */
export async function getBranch(cwd?: string): Promise<string> {
  const options = cwd ? { cwd } : {};
  const { stdout } = await execAsync('git branch --show-current', options);
  return stdout.trim();
}

/**
 * Get all branches (local and remote)
 */
export async function getBranches(cwd?: string): Promise<GitBranch[]> {
  const options = cwd ? { cwd } : {};
  const { stdout } = await execAsync('git branch -a -v', options);
  return stdout
    .split('\n')
    .filter(Boolean)
    .map((line: string) => {
      const current = line.startsWith('*');
      const trimmed = line.replace(/^\*?\s+/, '');
      const parts = trimmed.split(/\s+/);
      const name = parts[0] || '';
      const isRemote = name.startsWith('remotes/');

      return {
        name: isRemote ? name.replace('remotes/', '') : name,
        current,
        remote: isRemote ? name.split('/')[1] : undefined,
      };
    });
}

/**
 * Create a new branch
 */
export async function createBranch(
  name: string,
  checkout = false,
  cwd?: string
): Promise<void> {
  const options = cwd ? { cwd } : {};
  if (checkout) {
    await execAsync(`git checkout -b ${name}`, options);
  } else {
    await execAsync(`git branch ${name}`, options);
  }
}

/**
 * Switch to a branch
 */
export async function checkout(branch: string, cwd?: string): Promise<void> {
  const options = cwd ? { cwd } : {};
  await execAsync(`git checkout ${branch}`, options);
}

/**
 * Delete a branch
 */
export async function deleteBranch(
  name: string,
  force = false,
  cwd?: string
): Promise<void> {
  const options = cwd ? { cwd } : {};
  const flag = force ? '-D' : '-d';
  await execAsync(`git branch ${flag} ${name}`, options);
}

// ============================================================================
// Commit Operations
// ============================================================================

/**
 * Get recent commits
 */
export async function getCommits(
  count = 10,
  cwd?: string
): Promise<GitCommit[]> {
  const options = cwd ? { cwd } : {};
  const format = '%H|%h|%an|%ae|%aI|%s';
  const { stdout } = await execAsync(
    `git log -${count} --format="${format}"`,
    options
  );

  return stdout
    .split('\n')
    .filter(Boolean)
    .map((line: string) => {
      const [hash, shortHash, author, email, dateStr, message] = line.split('|');
      return {
        hash: hash || '',
        shortHash: shortHash || '',
        author: author || '',
        email: email || '',
        date: new Date(dateStr || ''),
        message: message || '',
      };
    });
}

/**
 * Create a commit
 */
export async function commit(message: string, cwd?: string): Promise<string> {
  const options = cwd ? { cwd } : {};
  const { stdout } = await execAsync(
    `git commit -m "${message.replace(/"/g, '\\"')}"`,
    options
  );
  const match = stdout.match(/\[.+\s+([a-f0-9]+)\]/);
  return match?.[1] || '';
}

/**
 * Amend the last commit
 */
export async function amendCommit(
  message?: string,
  cwd?: string
): Promise<void> {
  const options = cwd ? { cwd } : {};
  if (message) {
    await execAsync(
      `git commit --amend -m "${message.replace(/"/g, '\\"')}"`,
      options
    );
  } else {
    await execAsync('git commit --amend --no-edit', options);
  }
}

// ============================================================================
// Staging Operations
// ============================================================================

/**
 * Stage files
 */
export async function add(
  files: string | string[] = '.',
  cwd?: string
): Promise<void> {
  const options = cwd ? { cwd } : {};
  const fileList = Array.isArray(files) ? files.join(' ') : files;
  await execAsync(`git add ${fileList}`, options);
}

/**
 * Unstage files
 */
export async function reset(
  files: string | string[],
  cwd?: string
): Promise<void> {
  const options = cwd ? { cwd } : {};
  const fileList = Array.isArray(files) ? files.join(' ') : files;
  await execAsync(`git reset HEAD ${fileList}`, options);
}

/**
 * Discard changes in working directory
 */
export async function discardChanges(
  files: string | string[],
  cwd?: string
): Promise<void> {
  const options = cwd ? { cwd } : {};
  const fileList = Array.isArray(files) ? files.join(' ') : files;
  await execAsync(`git checkout -- ${fileList}`, options);
}

// ============================================================================
// Remote Operations
// ============================================================================

/**
 * Get remotes
 */
export async function getRemotes(cwd?: string): Promise<GitRemote[]> {
  const options = cwd ? { cwd } : {};
  const { stdout } = await execAsync('git remote -v', options);

  return stdout
    .split('\n')
    .filter(Boolean)
    .map((line: string) => {
      const match = line.match(/^(\S+)\s+(\S+)\s+\((\w+)\)$/);
      if (!match) return null;
      return {
        name: match[1] || '',
        url: match[2] || '',
        type: match[3] as 'fetch' | 'push',
      };
    })
    .filter((r): r is GitRemote => r !== null);
}

/**
 * Pull from remote
 */
export async function pull(
  remote = 'origin',
  branch?: string,
  cwd?: string
): Promise<void> {
  const options = cwd ? { cwd } : {};
  const branchArg = branch ? ` ${branch}` : '';
  await execAsync(`git pull ${remote}${branchArg}`, options);
}

/**
 * Push to remote
 */
export async function push(
  remote = 'origin',
  branch?: string,
  options: { force?: boolean; setUpstream?: boolean; cwd?: string } = {}
): Promise<void> {
  const execOptions = options.cwd ? { cwd: options.cwd } : {};
  const flags: string[] = [];
  if (options.force) flags.push('-f');
  if (options.setUpstream) flags.push('-u');
  const branchArg = branch ? ` ${branch}` : '';
  await execAsync(
    `git push ${flags.join(' ')} ${remote}${branchArg}`,
    execOptions
  );
}

/**
 * Fetch from remote
 */
export async function fetch(
  remote = 'origin',
  prune = false,
  cwd?: string
): Promise<void> {
  const options = cwd ? { cwd } : {};
  const pruneFlag = prune ? ' --prune' : '';
  await execAsync(`git fetch ${remote}${pruneFlag}`, options);
}

// ============================================================================
// Diff Operations
// ============================================================================

/**
 * Get diff stats
 */
export async function getDiffStats(
  ref = 'HEAD',
  cwd?: string
): Promise<GitDiff[]> {
  const options = cwd ? { cwd } : {};
  const { stdout } = await execAsync(`git diff --stat ${ref}`, options);

  return stdout
    .split('\n')
    .filter((line) => line.includes('|'))
    .map((line: string) => {
      const match = line.match(/^\s*(.+?)\s*\|\s*(\d+)/);
      if (!match) return null;

      const file = match[1]?.trim() || '';
      const changes = parseInt(match[2] || '0', 10);
      const binary = line.includes('Bin');

      // Estimate additions/deletions from +/- symbols
      const plusCount = (line.match(/\+/g) || []).length;
      const minusCount = (line.match(/-/g) || []).length;
      const total = plusCount + minusCount;

      return {
        file,
        additions: total > 0 ? Math.round((plusCount / total) * changes) : 0,
        deletions: total > 0 ? Math.round((minusCount / total) * changes) : 0,
        binary,
      };
    })
    .filter((d): d is GitDiff => d !== null);
}

/**
 * Get raw diff
 */
export async function getDiff(
  ref = 'HEAD',
  files?: string[],
  cwd?: string
): Promise<string> {
  const options = cwd ? { cwd } : {};
  const fileArgs = files ? ` -- ${files.join(' ')}` : '';
  const { stdout } = await execAsync(`git diff ${ref}${fileArgs}`, options);
  return stdout;
}

// ============================================================================
// Stash Operations
// ============================================================================

/**
 * Stash changes
 */
export async function stash(message?: string, cwd?: string): Promise<void> {
  const options = cwd ? { cwd } : {};
  const msgArg = message ? ` -m "${message.replace(/"/g, '\\"')}"` : '';
  await execAsync(`git stash${msgArg}`, options);
}

/**
 * Pop stash
 */
export async function stashPop(index = 0, cwd?: string): Promise<void> {
  const options = cwd ? { cwd } : {};
  await execAsync(`git stash pop stash@{${index}}`, options);
}

/**
 * List stashes
 */
export async function stashList(
  cwd?: string
): Promise<{ index: number; message: string }[]> {
  const options = cwd ? { cwd } : {};
  const { stdout } = await execAsync('git stash list', options);

  return stdout
    .split('\n')
    .filter(Boolean)
    .map((line: string, index: number) => {
      const match = line.match(/stash@\{\d+\}:\s*(.+)/);
      return {
        index,
        message: match?.[1] || line,
      };
    });
}

// ============================================================================
// Tag Operations
// ============================================================================

/**
 * Get tags
 */
export async function getTags(cwd?: string): Promise<string[]> {
  const options = cwd ? { cwd } : {};
  const { stdout } = await execAsync('git tag -l', options);
  return stdout.split('\n').filter(Boolean);
}

/**
 * Create a tag
 */
export async function createTag(
  name: string,
  message?: string,
  cwd?: string
): Promise<void> {
  const options = cwd ? { cwd } : {};
  if (message) {
    await execAsync(
      `git tag -a ${name} -m "${message.replace(/"/g, '\\"')}"`,
      options
    );
  } else {
    await execAsync(`git tag ${name}`, options);
  }
}

/**
 * Delete a tag
 */
export async function deleteTag(name: string, cwd?: string): Promise<void> {
  const options = cwd ? { cwd } : {};
  await execAsync(`git tag -d ${name}`, options);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get root directory of git repository
 */
export async function getRepoRoot(cwd?: string): Promise<string> {
  const options = cwd ? { cwd } : {};
  const { stdout } = await execAsync(
    'git rev-parse --show-toplevel',
    options
  );
  return stdout.trim();
}

/**
 * Get current commit hash
 */
export async function getCurrentHash(
  short = false,
  cwd?: string
): Promise<string> {
  const options = cwd ? { cwd } : {};
  const flag = short ? '--short' : '';
  const { stdout } = await execAsync(`git rev-parse ${flag} HEAD`, options);
  return stdout.trim();
}

/**
 * Check if a commit exists
 */
export async function commitExists(hash: string, cwd?: string): Promise<boolean> {
  try {
    const options = cwd ? { cwd } : {};
    await execAsync(`git cat-file -t ${hash}`, options);
    return true;
  } catch {
    return false;
  }
}
