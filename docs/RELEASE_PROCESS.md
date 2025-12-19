# PhilJS Release Process

This document outlines the complete release process for PhilJS, from planning to post-release activities.

## Table of Contents

1. [Release Types](#release-types)
2. [Release Schedule](#release-schedule)
3. [Pre-Release Phase](#pre-release-phase)
4. [Release Phase](#release-phase)
5. [Post-Release Phase](#post-release-phase)
6. [Hotfix Process](#hotfix-process)
7. [Version Numbering](#version-numbering)
8. [Automation](#automation)

---

## Release Types

### Major Release (x.0.0)
- **Frequency**: 6-12 months
- **Contains**: Breaking changes, major features, architectural improvements
- **Examples**: v1.0.0 → v2.0.0
- **Process Time**: 2-4 weeks of preparation
- **Approval Required**: All core team members

### Minor Release (x.y.0)
- **Frequency**: 1-2 months
- **Contains**: New features, non-breaking API additions
- **Examples**: v2.0.0 → v2.1.0
- **Process Time**: 1 week of preparation
- **Approval Required**: Engineering lead

### Patch Release (x.y.z)
- **Frequency**: As needed (weekly/bi-weekly)
- **Contains**: Bug fixes, documentation updates
- **Examples**: v2.0.0 → v2.0.1
- **Process Time**: 1-2 days
- **Approval Required**: Release manager

### Hotfix Release
- **Frequency**: Emergency only
- **Contains**: Critical bug fixes, security patches
- **Examples**: v2.0.0 → v2.0.1 (emergency)
- **Process Time**: Same day
- **Approval Required**: Any two core team members

---

## Release Schedule

### Regular Release Cadence

```
January:   v2.1.0 (Minor) - New features from Q4 feedback
February:  v2.1.x (Patch) - Bug fixes
March:     v2.2.0 (Minor) - Q1 features
April:     v2.2.x (Patch) - Bug fixes
May:       v2.3.0 (Minor) - Q1 features
June:      v2.3.x (Patch) - Bug fixes + summer prep
July:      v2.4.0 (Minor) - Summer features
August:    v2.4.x (Patch) - Bug fixes
September: v2.5.0 (Minor) - Q3 features
October:   v2.5.x (Patch) - Bug fixes
November:  v2.6.0 (Minor) - Q3 features
December:  v3.0.0 (Major) - Breaking changes, major features
```

### Release Windows

- **Primary**: Tuesday-Thursday, 9 AM - 11 AM PST
  - Allows time for immediate support
  - Avoids Monday (weekend issues) and Friday (weekend coverage)

- **Avoid**:
  - Major holidays
  - Last week of December
  - Company-wide events
  - Right before conferences (unless intentional)

---

## Pre-Release Phase

### 1. Planning (Major/Minor: 2-4 weeks before, Patch: 1 week before)

**Tasks:**
- [ ] Review GitHub issues and PRs for inclusion
- [ ] Create milestone for release
- [ ] Assign issues to milestone
- [ ] Communicate timeline to team
- [ ] Draft release notes outline

**For Major Releases:**
- [ ] Review breaking changes and deprecations
- [ ] Plan migration path
- [ ] Schedule beta releases
- [ ] Plan documentation updates

### 2. Development (Until feature freeze)

**Tasks:**
- [ ] Implement planned features/fixes
- [ ] Write tests for all changes
- [ ] Update documentation alongside code
- [ ] Keep CHANGELOG.md updated with [Unreleased] entries

**Code Review Standards:**
- All PRs require 2+ approvals for major releases
- All PRs require 1+ approval for minor/patch releases
- 100% of new code must have tests
- Documentation required for new features

### 3. Feature Freeze (1 week before release)

**Tasks:**
- [ ] No new features merged
- [ ] Focus on bug fixes only
- [ ] Run full test suite
- [ ] Update version numbers
- [ ] Finalize CHANGELOG.md
- [ ] Create release notes from template

**Version Update Command:**
```bash
# Run version update script
node scripts/update-version.mjs
```

### 4. Release Candidate (3-5 days before release)

**Create RC:**
```bash
# Update to RC version
node scripts/update-version.mjs --version 2.1.0-rc.1

# Build and test
pnpm clean
pnpm install
pnpm build
pnpm test

# Create RC tag
git tag -a v2.1.0-rc.1 -m "Release Candidate 1 for v2.1.0"
git push origin v2.1.0-rc.1

# Publish RC to NPM
pnpm publish -r --tag next
```

**RC Testing:**
- [ ] Install in test applications
- [ ] Run integration tests
- [ ] Performance benchmarks
- [ ] Bundle size verification
- [ ] Documentation review
- [ ] Community testing (ask for feedback)

**If Issues Found:**
- Fix issues
- Create RC.2, RC.3, etc.
- Repeat testing

### 5. Final Preparation (1-2 days before)

**Tasks:**
- [ ] All tests passing
- [ ] All RC issues resolved
- [ ] CHANGELOG.md finalized
- [ ] Release notes finalized
- [ ] Documentation updated
- [ ] Blog post drafted
- [ ] Social media posts prepared
- [ ] Email announcement drafted

**Verification Checklist:**
```bash
# Run full verification
./scripts/pre-release-verification.sh

# Manual checks:
# - All package.json versions correct
# - No pending PRs for this milestone
# - CI/CD passing on main branch
# - Documentation built successfully
```

---

## Release Phase

### Day-of-Release Checklist

**Morning (2-3 hours before release)**

1. **Final Verification**
   ```bash
   # Clean build and test
   pnpm clean
   pnpm install
   pnpm build
   pnpm test

   # Verify versions
   node scripts/verify-versions.mjs

   # Check bundle sizes
   pnpm check:budgets
   ```

2. **Team Sync**
   - [ ] All team members online and available
   - [ ] Rollback plan reviewed
   - [ ] Support channels monitored

3. **Create Git Tag**
   ```bash
   git checkout main
   git pull origin main
   git tag -a v2.1.0 -m "PhilJS v2.1.0"
   ```

**Release Time**

4. **Push Tag**
   ```bash
   git push origin v2.1.0
   ```

5. **Publish to NPM**

   **Option A: Using Changesets (Recommended)**
   ```bash
   # Publish all packages
   pnpm changeset publish
   ```

   **Option B: Manual Publishing**
   ```bash
   # Publish each package individually
   cd packages/philjs-core
   npm publish --access public

   cd ../philjs-compiler
   npm publish --access public

   # ... repeat for all packages
   ```

6. **Verify NPM Publication**
   ```bash
   # Check each package on NPM
   npm view philjs-core version
   npm view philjs-compiler version
   npm view philjs-router version

   # Test installation
   mkdir /tmp/test-philjs
   cd /tmp/test-philjs
   npm init -y
   npm install philjs-core@2.1.0
   node -e "console.log(require('philjs-core'))"
   ```

7. **Create GitHub Release**
   ```bash
   gh release create v2.1.0 \
     --title "PhilJS v2.1.0" \
     --notes-file RELEASE_NOTES_v2.1.md \
     --verify-tag
   ```

8. **Deploy Documentation**
   ```bash
   cd docs-site
   pnpm build
   pnpm deploy
   # Or trigger deployment via CI/CD
   ```

9. **Update Website**
   - [ ] Update homepage with latest version
   - [ ] Add release announcement banner
   - [ ] Update changelog page

**Post-Release (Within 1 Hour)**

10. **Announcements**
    - [ ] Twitter announcement
    - [ ] Post to r/javascript, r/webdev
    - [ ] Hacker News submission
    - [ ] LinkedIn post
    - [ ] Dev.to article
    - [ ] Send email newsletter
    - [ ] Discord/community announcement

11. **Monitoring**
    ```bash
    # Watch NPM downloads
    npm-stat philjs-core

    # Monitor error tracking
    # Check Sentry/error dashboards

    # Watch GitHub issues
    gh issue list --label "bug" --state open
    ```

---

## Post-Release Phase

### First 24 Hours

**Monitoring:**
- [ ] NPM download stats
- [ ] GitHub issues (watch for regressions)
- [ ] Social media mentions
- [ ] Error tracking dashboards
- [ ] Community feedback (Discord, forums)

**Quick Response:**
- Critical bugs: Hotfix within 4 hours
- High priority bugs: Patch release within 1-2 days
- Documentation issues: Fix immediately

### First Week

**Community Engagement:**
- [ ] Respond to all GitHub issues
- [ ] Answer questions on Discord/forums
- [ ] Monitor Stack Overflow for PhilJS questions
- [ ] Collect feedback for next release

**Metrics:**
- [ ] Compile download statistics
- [ ] GitHub star growth
- [ ] Issue resolution rate
- [ ] Community sentiment analysis

**Documentation:**
- [ ] Update FAQ based on questions
- [ ] Create additional examples if needed
- [ ] Fix any documentation errors

### Retrospective (End of Week 1)

**Meeting Agenda:**
- What went well?
- What could be improved?
- Were there any surprises?
- Action items for next release

**Document:**
- Release metrics
- Issues encountered
- Time spent on each phase
- Improvements for next release

---

## Hotfix Process

### When to Create a Hotfix

**Critical Issues:**
- Security vulnerabilities
- Data loss bugs
- Application crash on startup
- Complete feature breakage
- NPM package corruption

**Process:**

1. **Immediate Response (Within 1 hour)**
   ```bash
   # Create hotfix branch from release tag
   git checkout -b hotfix/v2.1.1 v2.1.0

   # Fix the critical issue
   # ... make changes ...

   # Test thoroughly
   pnpm test
   ```

2. **Version Bump**
   ```bash
   # Update version to patch
   node scripts/update-version.mjs --version 2.1.1

   # Update CHANGELOG
   # Add hotfix entry
   ```

3. **Release (Within 4 hours of discovery)**
   ```bash
   # Commit fix
   git add .
   git commit -m "Hotfix: [critical issue description]"

   # Create tag
   git tag -a v2.1.1 -m "Hotfix: [critical issue]"

   # Push
   git push origin hotfix/v2.1.1
   git push origin v2.1.1

   # Publish to NPM
   pnpm publish -r

   # Create GitHub release
   gh release create v2.1.1 \
     --title "PhilJS v2.1.1 (Hotfix)" \
     --notes "Critical fix for [issue]" \
     --verify-tag
   ```

4. **Communication**
   ```markdown
   # Alert Template

   🚨 HOTFIX RELEASE: PhilJS v2.1.1

   A critical issue was discovered in v2.1.0:
   [Description of issue]

   Impact: [Who is affected]

   Fix: Update to v2.1.1 immediately

   ```bash
   pnpm update philjs-core@2.1.1
   ```

   Apologies for any inconvenience.
   ```

5. **Merge to Main**
   ```bash
   # Merge hotfix back to main
   git checkout main
   git merge hotfix/v2.1.1
   git push origin main
   ```

---

## Version Numbering

### Semantic Versioning

PhilJS follows [Semantic Versioning 2.0.0](https://semver.org/):

**Format:** MAJOR.MINOR.PATCH

**MAJOR** (x.0.0):
- Breaking changes to public APIs
- Removal of deprecated features
- Major architectural changes
- Changes requiring code updates

**MINOR** (0.x.0):
- New features (backwards compatible)
- New APIs
- Deprecations (with working alternatives)
- Performance improvements

**PATCH** (0.0.x):
- Bug fixes
- Documentation updates
- Internal refactoring
- Security patches

### Pre-Release Versions

**Alpha** (x.y.z-alpha.n):
- Very early, unstable
- For internal testing only
- Example: 2.1.0-alpha.1

**Beta** (x.y.z-beta.n):
- Feature complete
- For community testing
- Example: 2.1.0-beta.1

**Release Candidate** (x.y.z-rc.n):
- Final testing before release
- No new features
- Example: 2.1.0-rc.1

### NPM Dist Tags

- `latest`: Stable release (default)
- `next`: Release candidates
- `beta`: Beta releases
- `alpha`: Alpha releases
- `canary`: Nightly builds (if implemented)

```bash
# Publish to different tags
npm publish --tag next    # RC
npm publish --tag beta    # Beta
npm publish --tag latest  # Stable
```

---

## Automation

### Scripts

**Version Management:**
```bash
# Update all package versions
node scripts/update-version.mjs --version 2.1.0

# Verify versions are consistent
node scripts/verify-versions.mjs

# Add NPM metadata
node scripts/add-npm-metadata.mjs

# Verify NPM configs
node scripts/verify-npm-config.mjs
```

**Pre-Release Checks:**
```bash
# Run all checks before release
./scripts/pre-release-verification.sh
# Includes:
# - Build all packages
# - Run all tests
# - Check TypeScript
# - Verify bundle sizes
# - Check for uncommitted changes
```

**Publishing:**
```bash
# Publish all packages
./scripts/publish-all.sh

# Or use changesets
pnpm changeset publish
```

### CI/CD Integration

**GitHub Actions:**

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build

      - name: Test
        run: pnpm test

      - name: Publish to NPM
        run: pnpm publish -r
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: PhilJS ${{ github.ref }}
          body_path: RELEASE_NOTES.md
```

### Changesets (Recommended)

PhilJS uses [Changesets](https://github.com/changesets/changesets) for version management:

**Adding a Changeset:**
```bash
# After making changes, add a changeset
pnpm changeset

# Follow prompts:
# - Select packages that changed
# - Select change type (major/minor/patch)
# - Write summary of changes
```

**Creating a Release:**
```bash
# 1. Create version changes
pnpm changeset version

# 2. Review changes to CHANGELOG and package.json

# 3. Commit
git add .
git commit -m "Version packages"

# 4. Publish
pnpm changeset publish

# 5. Push tags
git push --follow-tags
```

---

## Checklist Templates

### Minor Release Checklist

```markdown
## PhilJS v2.X.0 Release Checklist

### Pre-Release
- [ ] All features merged and tested
- [ ] CHANGELOG.md updated
- [ ] Release notes drafted
- [ ] Version numbers updated
- [ ] RC published and tested
- [ ] Documentation updated
- [ ] Blog post drafted

### Release Day
- [ ] Final build and test
- [ ] Tag created and pushed
- [ ] Packages published to NPM
- [ ] GitHub release created
- [ ] Documentation deployed
- [ ] Announcements posted

### Post-Release
- [ ] Monitor for issues (24h)
- [ ] Respond to community feedback
- [ ] Update metrics
- [ ] Retrospective scheduled
```

### Patch Release Checklist

```markdown
## PhilJS v2.X.Y Release Checklist

### Pre-Release
- [ ] Bug fixes merged
- [ ] CHANGELOG.md updated
- [ ] Tests passing
- [ ] Version numbers updated

### Release Day
- [ ] Build and test
- [ ] Tag and publish
- [ ] GitHub release
- [ ] Brief announcement

### Post-Release
- [ ] Monitor for issues (6h)
- [ ] Update tracking
```

---

## Communication Templates

### Release Announcement (Twitter)

```
🚀 PhilJS v2.1.0 is here!

✨ New Features:
- [Feature 1]
- [Feature 2]
- [Feature 3]

📦 Install: npm install philjs-core@2.1.0

📖 Docs: https://philjs.dev/docs/v2.1
📝 Release Notes: https://github.com/[...]/releases/v2.1.0

#JavaScript #WebDev #PhilJS
```

### Hotfix Announcement

```
🔥 Hotfix: PhilJS v2.1.1

Fixed critical issue affecting [affected users]

Please update immediately:
npm install philjs-core@2.1.1

Details: [GitHub issue link]

Sorry for any inconvenience!
```

---

## Tools and Resources

### Required Access
- NPM publish access (@philjs organization)
- GitHub repository admin
- Documentation site deployment
- Social media accounts
- Email newsletter platform

### Helpful Tools
- `npm-stat`: NPM download statistics
- `gh`: GitHub CLI
- `changesets`: Version management
- Sentry/error tracking
- Analytics dashboard

---

**Last Updated**: December 18, 2025
**Owner**: Release Management Team
**Review Frequency**: Quarterly
