# Dependency Update Automation

This repository is configured with two automated dependency update tools: **Dependabot** and **Renovate**. You can choose to use either one based on your preferences.

## Dependabot Configuration

Dependabot is GitHub's native dependency update tool. The configuration is in `.github/dependabot.yml`.

### Features

- **Weekly updates** on Mondays at 9:00 AM
- **Grouped updates**: Minor and patch updates are grouped together to reduce PR noise
- **Separate major updates**: Major version updates get individual PRs for careful review
- **Multiple ecosystems**:
  - npm packages (root, all packages/*, examples/*)
  - GitHub Actions workflows
- **Smart labeling**: PRs are labeled by package and type
- **Semantic commits**: Uses conventional commit prefixes (`chore:`, `ci:`)

### Monitored Directories

Dependabot monitors the following directories:
- Root `package.json`
- Key packages: `philjs-core`, `philjs-router`, `philjs-ssr`, `philjs-compiler`, `philjs-cli`, `philjs-islands`, `philjs-devtools`, `philjs-graphql`
- Example apps: `storefront`, `todo-app`, `demo-app`
- GitHub Actions in `.github/workflows/`

### Enabling Dependabot

Dependabot is enabled automatically if this repository is hosted on GitHub. No additional setup required.

To disable it, delete or rename `.github/dependabot.yml`.

### Customizing Dependabot

Edit `.github/dependabot.yml` to:
- Change update schedule
- Add/remove directories to monitor
- Modify grouping rules
- Change labels or commit message format

## Renovate Configuration

Renovate is a more flexible and feature-rich alternative. The configuration is in `.github/renovate.json`.

### Features

- **Weekly updates** on Mondays
- **Dependency dashboard**: Creates a GitHub issue to track all updates
- **Smart grouping**:
  - All non-major updates grouped together
  - Major updates separated for review
  - Related packages grouped (e.g., Vite + Vitest, ESLint packages)
- **Auto-merge capabilities**: Low-risk updates can auto-merge after CI passes
- **Lock file maintenance**: Automated `pnpm-lock.yaml` updates
- **Security alerts**: Immediate updates for vulnerabilities
- **Minimum release age**: Waits 3 days before updating to new versions (stability)

### Key Features Enabled

- **Post-update options**: `pnpmDedupe` runs after updates
- **Semantic commits**: Uses conventional commit format
- **Platform automerge**: Merges PRs automatically for low-risk updates
- **OSV vulnerability alerts**: Security scanning

### Enabling Renovate

1. Install the [Renovate GitHub App](https://github.com/apps/renovate)
2. Grant access to your repository
3. Renovate will automatically detect `.github/renovate.json`

To disable it, delete or rename `.github/renovate.json`, or remove repository access from the Renovate app.

### Customizing Renovate

Edit `.github/renovate.json` to:
- Adjust auto-merge rules
- Change update schedules
- Modify grouping strategies
- Configure branch and PR limits

## Which One Should You Use?

### Use Dependabot if:
- You prefer GitHub's native integration
- You want a simpler, no-frills solution
- You're already familiar with Dependabot
- You don't need advanced features like auto-merge

### Use Renovate if:
- You want more control and flexibility
- You prefer auto-merging low-risk updates
- You want a dependency dashboard
- You need advanced grouping and scheduling
- You want to wait for stable releases (minimum release age)

### Can I Use Both?

**Not recommended.** Using both will create duplicate PRs. Choose one and disable the other.

## pnpm Monorepo Considerations

Both tools are configured to work with this pnpm monorepo:

### Dependabot
- Requires explicit directory entries for each workspace
- Updates shown in the current configuration for key packages and examples
- Add more directories manually as needed

### Renovate
- Automatically detects pnpm workspaces
- Uses `pnpmDedupe` post-update option
- Ignores internal workspace packages (philjs-*)

### pnpm Version Updates

Both configurations ignore `pnpm` package updates since the version is managed via the `packageManager` field in the root `package.json`. Update pnpm manually:

```json
{
  "packageManager": "pnpm@9.15.4"
}
```

## Handling Updates

### Reviewing PRs

1. Check the PR description for changelog links
2. Review breaking changes for major updates
3. Ensure CI passes (tests, linting, build)
4. Check bundle size impact (automated check runs)
5. Merge when satisfied

### Auto-merge (Renovate only)

Low-risk updates (patch versions, dev dependencies) can auto-merge if:
- CI passes
- No conflicts
- Platform automerge is enabled

You can customize auto-merge rules in `renovate.json`.

## Troubleshooting

### Too Many PRs

**Dependabot:**
- Adjust `open-pull-requests-limit`
- Expand grouping rules in `groups`

**Renovate:**
- Adjust `prConcurrentLimit` and `prHourlyLimit`
- Broaden grouping rules in `packageRules`

### CI Failures

- Ensure CI workflows support automated commits
- Check if tests are flaky
- Review if major updates need code changes

### Merge Conflicts

- Both tools will automatically rebase PRs
- If conflicts persist, close the PR and it will be recreated

### Ignored Updates

Check the configuration files for:
- `ignore` sections (Dependabot)
- `ignoreDeps` or disabled package rules (Renovate)

## Additional Resources

- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Renovate Documentation](https://docs.renovatebot.com/)
- [pnpm Workspace Guide](https://pnpm.io/workspaces)
