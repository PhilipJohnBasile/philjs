# PhilJS Complete Build Prompts

This package contains all the prompts needed to build PhilJS - a revolutionary front-end framework for 2026.

## Contents

1. **01-build-framework.md** - Builds the complete PhilJS framework
2. **02-build-docs-site.md** - Builds the documentation website
3. **03-write-documentation.md** - Writes all documentation content
4. **04-validation-testing.md** - Validates code matches docs and tests everything

## How to Use

### Prerequisites

1. Install Claude Code:
```bash
npm install -g @anthropic-ai/claude-code
```

2. Make sure you have an Anthropic API key configured

### Step 1: Build the Framework

```bash
cd ~/projects
mkdir philjs
cd philjs
git init
claude --dangerously-skip-permissions
```

Then paste the entire contents of **01-build-framework.md**

### Step 2: Build Documentation Site

```bash
cd ~/projects
mkdir philjs-docs
cd philjs-docs
git init
claude --dangerously-skip-permissions
```

Then paste the entire contents of **02-build-docs-site.md**

### Step 3: Write Documentation Content

In the same philjs-docs directory:
```bash
claude --dangerously-skip-permissions
```

Then paste the entire contents of **03-write-documentation.md**

### Step 4: Validate & Test Everything

Back in the philjs directory:
```bash
cd ~/projects/philjs
claude --dangerously-skip-permissions
```

Then paste the entire contents of **04-validation-testing.md**

## About the Prompts

### What is `ultrathink`?

The `ultrathink` keyword at the start of each prompt gives Claude extended thinking budget (31,999 tokens). This helps Claude:
- Plan better architecture
- Consider tradeoffs deeply
- Make better design decisions
- Think through complex problems

**Note:** This only affects thinking/planning, not output length or coding time.

### What is `--dangerously-skip-permissions`?

This flag prevents Claude Code from asking permission for every file it creates or command it runs. It's essential for autonomous work on large projects.

**Safety:** It's called "dangerous" but for your own projects it's fine. Claude still won't do anything truly destructive.

## What Gets Built

### PhilJS Framework
- 9 npm packages (@philjs/core, router, data, etc.)
- Full TypeScript implementation
- Compiler and build system
- CLI tools
- 3 example applications
- Complete test suite

### Documentation Site
- Beautiful, fast documentation website
- Interactive code playground
- 50+ documentation pages
- Search functionality
- Blog
- Examples gallery

### Documentation Content
- 120+ pages of documentation
- 150,000+ words
- Complete API reference
- Tutorials and guides
- Migration guides
- Best practices

### Validation & Testing
- 500+ automated tests
- Code-documentation alignment verification
- All features tested and working
- Production-ready validation

## Estimated Time

Each prompt will run for several hours:
- Framework build: 6-10 hours
- Docs site: 4-6 hours
- Content writing: 8-12 hours
- Validation: 6-10 hours

## API Costs

These are large projects. Expect to use:
- Framework: ~5-10M tokens ($15-30)
- Docs site: ~3-5M tokens ($10-15)
- Content: ~8-12M tokens ($25-40)
- Validation: ~5-8M tokens ($15-25)

**Total estimated cost: $65-110**

Set spending limits in your Anthropic Console to avoid surprises.

## Tips for Success

1. **Start fresh** - Use a new conversation for each prompt
2. **Don't interrupt** - Let Claude Code work autonomously
3. **Check progress** - Claude will show progress as it works
4. **Save work** - Git commit regularly
5. **Test locally** - Run the code to verify it works

## What If It Stops?

If Claude Code hits token limits or stops:
1. Review what was built
2. Start a new session
3. Ask Claude to continue from where it left off
4. Provide context about what's already done

## Troubleshooting

### "Rate limit exceeded"
Wait a few minutes and it will resume automatically.

### "Context window full"
Start a new session and reference previous work.

### "Command not found: claude"
Install Claude Code: `npm install -g @anthropic-ai/claude-code`

### Files not being created
Make sure you're in the right directory and used `--dangerously-skip-permissions`

## Support

For Claude Code issues: https://docs.claude.com/en/docs/claude-code
For Anthropic API: https://console.anthropic.com

## License

These prompts are provided as-is. The PhilJS framework they generate would be yours to license as you choose.

---

Built with ❤️ for the developer community
