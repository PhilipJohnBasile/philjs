/**
 * Tests for PhilJS Git Utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exec } from 'child_process';
import util from 'util';

// Mock child_process
vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

vi.mock('util', () => ({
  default: {
    promisify: vi.fn((fn) => fn),
  },
}));

// Import after mocking
import {
  getGitStatus,
  isClean,
  isGitRepository,
  getBranch,
  getBranches,
  createBranch,
  checkout,
  deleteBranch,
  getCommits,
  commit,
  add,
  reset,
  getRemotes,
  getDiffStats,
  stashList,
  getTags,
  getRepoRoot,
  getCurrentHash,
  commitExists,
} from './index';

const mockExec = exec as unknown as ReturnType<typeof vi.fn>;

describe('Git Status Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getGitStatus', () => {
    it('should parse porcelain status output', async () => {
      mockExec.mockImplementation((cmd, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        callback?.(null, { stdout: ' M file1.ts\nA  file2.ts\n?? file3.ts\n' });
      });

      const status = await getGitStatus();
      expect(status).toHaveLength(3);
      expect(status[0]).toEqual({ status: 'M', file: 'file1.ts' });
      expect(status[1]).toEqual({ status: 'A', file: 'file2.ts' });
      expect(status[2]).toEqual({ status: '??', file: 'file3.ts' });
    });

    it('should return empty array for clean working directory', async () => {
      mockExec.mockImplementation((cmd, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        callback?.(null, { stdout: '' });
      });

      const status = await getGitStatus();
      expect(status).toHaveLength(0);
    });
  });

  describe('isClean', () => {
    it('should return true when no changes', async () => {
      mockExec.mockImplementation((cmd, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        callback?.(null, { stdout: '' });
      });

      const clean = await isClean();
      expect(clean).toBe(true);
    });

    it('should return false when changes exist', async () => {
      mockExec.mockImplementation((cmd, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        callback?.(null, { stdout: 'M  file.ts\n' });
      });

      const clean = await isClean();
      expect(clean).toBe(false);
    });
  });

  describe('isGitRepository', () => {
    it('should return true for git repositories', async () => {
      mockExec.mockImplementation((cmd, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        callback?.(null, { stdout: '.git\n' });
      });

      const isRepo = await isGitRepository();
      expect(isRepo).toBe(true);
    });

    it('should return false for non-git directories', async () => {
      mockExec.mockImplementation((cmd, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        callback?.(new Error('Not a git repository'), { stdout: '' });
      });

      const isRepo = await isGitRepository();
      expect(isRepo).toBe(false);
    });
  });
});

describe('Branch Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBranch', () => {
    it('should return current branch name', async () => {
      mockExec.mockImplementation((cmd, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        callback?.(null, { stdout: 'main\n' });
      });

      const branch = await getBranch();
      expect(branch).toBe('main');
    });
  });

  describe('getBranches', () => {
    it('should parse branch list', async () => {
      mockExec.mockImplementation((cmd, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        callback?.(null, {
          stdout: '* main abc123 Latest commit\n  feature/test def456 Feature\n',
        });
      });

      const branches = await getBranches();
      expect(branches).toHaveLength(2);
      expect(branches[0]?.current).toBe(true);
      expect(branches[0]?.name).toBe('main');
      expect(branches[1]?.current).toBe(false);
    });
  });

  describe('createBranch', () => {
    it('should create branch without checkout', async () => {
      mockExec.mockImplementation((cmd, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        expect(cmd).toContain('git branch feature/new');
        callback?.(null, { stdout: '' });
      });

      await createBranch('feature/new');
    });

    it('should create and checkout branch', async () => {
      mockExec.mockImplementation((cmd, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        expect(cmd).toContain('git checkout -b feature/new');
        callback?.(null, { stdout: '' });
      });

      await createBranch('feature/new', true);
    });
  });

  describe('checkout', () => {
    it('should switch to branch', async () => {
      mockExec.mockImplementation((cmd, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        expect(cmd).toContain('git checkout main');
        callback?.(null, { stdout: '' });
      });

      await checkout('main');
    });
  });

  describe('deleteBranch', () => {
    it('should delete branch with -d flag', async () => {
      mockExec.mockImplementation((cmd, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        expect(cmd).toContain('git branch -d feature/old');
        callback?.(null, { stdout: '' });
      });

      await deleteBranch('feature/old');
    });

    it('should force delete with -D flag', async () => {
      mockExec.mockImplementation((cmd, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        expect(cmd).toContain('git branch -D feature/old');
        callback?.(null, { stdout: '' });
      });

      await deleteBranch('feature/old', true);
    });
  });
});

describe('Commit Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCommits', () => {
    it('should parse commit history', async () => {
      const logOutput = [
        'abc123def456|abc123|John Doe|john@example.com|2024-01-15T10:30:00Z|Initial commit',
        'def456ghi789|def456|Jane Doe|jane@example.com|2024-01-14T09:00:00Z|Add feature',
      ].join('\n');

      mockExec.mockImplementation((cmd, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        callback?.(null, { stdout: logOutput + '\n' });
      });

      const commits = await getCommits(2);
      expect(commits).toHaveLength(2);
      expect(commits[0]?.hash).toBe('abc123def456');
      expect(commits[0]?.shortHash).toBe('abc123');
      expect(commits[0]?.author).toBe('John Doe');
      expect(commits[0]?.message).toBe('Initial commit');
    });
  });

  describe('commit', () => {
    it('should create commit with message', async () => {
      mockExec.mockImplementation((cmd, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        expect(cmd).toContain('git commit -m');
        callback?.(null, { stdout: '[main abc123] Test commit\n' });
      });

      const hash = await commit('Test commit');
      expect(hash).toBe('abc123');
    });

    it('should escape quotes in message', async () => {
      mockExec.mockImplementation((cmd, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        expect(cmd).toContain('\\"');
        callback?.(null, { stdout: '[main def456] Message\n' });
      });

      await commit('Message with "quotes"');
    });
  });
});

describe('Staging Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('add', () => {
    it('should stage single file', async () => {
      mockExec.mockImplementation((cmd, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        expect(cmd).toContain('git add file.ts');
        callback?.(null, { stdout: '' });
      });

      await add('file.ts');
    });

    it('should stage multiple files', async () => {
      mockExec.mockImplementation((cmd, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        expect(cmd).toContain('git add file1.ts file2.ts');
        callback?.(null, { stdout: '' });
      });

      await add(['file1.ts', 'file2.ts']);
    });

    it('should stage all by default', async () => {
      mockExec.mockImplementation((cmd, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        expect(cmd).toContain('git add .');
        callback?.(null, { stdout: '' });
      });

      await add();
    });
  });

  describe('reset', () => {
    it('should unstage files', async () => {
      mockExec.mockImplementation((cmd, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        expect(cmd).toContain('git reset HEAD file.ts');
        callback?.(null, { stdout: '' });
      });

      await reset('file.ts');
    });
  });
});

describe('Remote Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRemotes', () => {
    it('should parse remote list', async () => {
      const remoteOutput = [
        'origin\thttps://github.com/user/repo.git (fetch)',
        'origin\thttps://github.com/user/repo.git (push)',
        'upstream\thttps://github.com/other/repo.git (fetch)',
        'upstream\thttps://github.com/other/repo.git (push)',
      ].join('\n');

      mockExec.mockImplementation((cmd, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        callback?.(null, { stdout: remoteOutput + '\n' });
      });

      const remotes = await getRemotes();
      expect(remotes).toHaveLength(4);
      expect(remotes[0]?.name).toBe('origin');
      expect(remotes[0]?.type).toBe('fetch');
    });
  });
});

describe('Tag Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTags', () => {
    it('should return list of tags', async () => {
      mockExec.mockImplementation((cmd, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        callback?.(null, { stdout: 'v1.0.0\nv1.1.0\nv2.0.0\n' });
      });

      const tags = await getTags();
      expect(tags).toEqual(['v1.0.0', 'v1.1.0', 'v2.0.0']);
    });

    it('should return empty array when no tags', async () => {
      mockExec.mockImplementation((cmd, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        callback?.(null, { stdout: '' });
      });

      const tags = await getTags();
      expect(tags).toEqual([]);
    });
  });
});

describe('Utility Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRepoRoot', () => {
    it('should return repository root path', async () => {
      mockExec.mockImplementation((cmd, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        callback?.(null, { stdout: '/home/user/project\n' });
      });

      const root = await getRepoRoot();
      expect(root).toBe('/home/user/project');
    });
  });

  describe('getCurrentHash', () => {
    it('should return full hash', async () => {
      mockExec.mockImplementation((cmd, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        expect(cmd).toContain('git rev-parse');
        expect(cmd).not.toContain('--short');
        callback?.(null, { stdout: 'abc123def456789\n' });
      });

      const hash = await getCurrentHash();
      expect(hash).toBe('abc123def456789');
    });

    it('should return short hash', async () => {
      mockExec.mockImplementation((cmd, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        expect(cmd).toContain('--short');
        callback?.(null, { stdout: 'abc123\n' });
      });

      const hash = await getCurrentHash(true);
      expect(hash).toBe('abc123');
    });
  });

  describe('commitExists', () => {
    it('should return true for existing commit', async () => {
      mockExec.mockImplementation((cmd, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        callback?.(null, { stdout: 'commit\n' });
      });

      const exists = await commitExists('abc123');
      expect(exists).toBe(true);
    });

    it('should return false for non-existing commit', async () => {
      mockExec.mockImplementation((cmd, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        callback?.(new Error('Not a valid object name'), { stdout: '' });
      });

      const exists = await commitExists('invalid');
      expect(exists).toBe(false);
    });
  });
});

describe('Stash Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('stashList', () => {
    it('should parse stash list', async () => {
      const stashOutput = [
        'stash@{0}: WIP on main: abc123 Current work',
        'stash@{1}: On feature: def456 Experimental changes',
      ].join('\n');

      mockExec.mockImplementation((cmd, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        callback?.(null, { stdout: stashOutput + '\n' });
      });

      const stashes = await stashList();
      expect(stashes).toHaveLength(2);
      expect(stashes[0]?.index).toBe(0);
      expect(stashes[0]?.message).toContain('WIP on main');
    });

    it('should return empty array when no stashes', async () => {
      mockExec.mockImplementation((cmd, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        callback?.(null, { stdout: '' });
      });

      const stashes = await stashList();
      expect(stashes).toEqual([]);
    });
  });
});
