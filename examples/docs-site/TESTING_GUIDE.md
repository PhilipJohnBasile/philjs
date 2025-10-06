# PhilJS Documentation Site - Testing Guide

## Quick Start

```bash
cd /Users/pjb/Git/philjs/examples/docs-site
npm run dev
```

Then open http://localhost:5173 in your browser.

## Test Checklist

### ✅ Navigation & Layout

1. **Sidebar**
   - [ ] Verify all 12 sections appear
   - [ ] Click "Learn" section to expand
   - [ ] Click "Signals" doc to navigate
   - [ ] Verify active doc is highlighted in brand color
   - [ ] Click other sections to verify expand/collapse works

2. **Main Content**
   - [ ] Read a doc and verify markdown renders beautifully
   - [ ] Check headings have proper hierarchy
   - [ ] Verify code blocks have language labels
   - [ ] Links should be brand-colored with hover effects

3. **Table of Contents** (desktop only, > 1280px)
   - [ ] Open http://localhost:5173/docs/learn/signals.md
   - [ ] Verify TOC appears on right side
   - [ ] Click a heading in TOC
   - [ ] Verify smooth scroll to that section
   - [ ] Scroll manually and watch active item change

### ✅ Search Functionality

1. **Open Search**
   - [ ] Press `Cmd+K` (Mac) or `Ctrl+K` (Windows)
   - [ ] Verify modal opens with search input focused

2. **Search Features**
   - [ ] Type "signals"
   - [ ] Verify results appear instantly
   - [ ] Use ↑↓ arrow keys to navigate results
   - [ ] Verify selected result is highlighted
   - [ ] Press Enter to navigate to selected doc
   - [ ] Verify modal closes and doc loads

3. **Search Edge Cases**
   - [ ] Open search again
   - [ ] Type "xyz123notfound"
   - [ ] Verify "No results found" message
   - [ ] Press ESC to close modal

### ✅ Code Blocks & Features

1. **Copy Buttons**
   - [ ] Navigate to any doc with code (e.g., /docs/learn/signals.md)
   - [ ] Find a code block
   - [ ] Hover over the "Copy" button
   - [ ] Verify button changes color on hover
   - [ ] Click "Copy" button
   - [ ] Verify button text changes to "Copied!"
   - [ ] Verify text returns to "Copy" after 2 seconds
   - [ ] Paste clipboard content to verify code copied correctly

2. **Syntax Highlighting**
   - [ ] Verify code has syntax highlighting (colors)
   - [ ] Verify language label appears (e.g., "TYPESCRIPT", "JAVASCRIPT")

### ✅ Navigation Elements

1. **Breadcrumbs**
   - [ ] Navigate to /docs/learn/signals.md
   - [ ] Verify breadcrumbs show: Home / Learn / Signals
   - [ ] Click "Home" breadcrumb
   - [ ] Verify navigation to homepage
   - [ ] Go back and click "Learn" breadcrumb

2. **Next/Previous Links**
   - [ ] Scroll to bottom of any doc
   - [ ] Verify "Previous" and "Next" buttons appear
   - [ ] Click "Next" button
   - [ ] Verify navigation to next doc
   - [ ] Verify buttons show correct doc titles
   - [ ] Hover over buttons to see animation effect

3. **Edit on GitHub**
   - [ ] Verify "Edit this page on GitHub" link appears below breadcrumbs
   - [ ] Click link
   - [ ] Verify opens GitHub in new tab

### ✅ Mobile Responsive

1. **Resize Browser**
   - [ ] Resize browser window to < 768px width
   - [ ] Verify hamburger menu button appears (top left)
   - [ ] Verify sidebar is hidden by default
   - [ ] Verify table of contents is hidden

2. **Mobile Menu**
   - [ ] Click hamburger menu button
   - [ ] Verify sidebar slides in from left
   - [ ] Verify dark overlay appears
   - [ ] Click overlay to close
   - [ ] Verify sidebar slides out

3. **Mobile Navigation**
   - [ ] Open menu again
   - [ ] Click a doc in sidebar
   - [ ] Verify sidebar closes automatically
   - [ ] Verify doc loads

### ✅ Callouts & Special Formatting

1. **Find Callout Examples**
   - Navigate to docs that might have callouts
   - Look for blockquotes with:
     - 💡 Tip (green)
     - ⚠️ Warning (amber)
     - ℹ️ Note (blue)
     - ❗ Important (red)
   - Verify they have colored left borders
   - Verify they have background tints

### ✅ Performance & UX

1. **Navigation Speed**
   - [ ] Click through 5-10 different docs rapidly
   - [ ] Verify instant navigation (no page reload)
   - [ ] Verify smooth scroll to top on each navigation

2. **Animations**
   - [ ] Watch sidebar expand/collapse animations
   - [ ] Watch search modal fade in
   - [ ] Watch hover effects on buttons
   - [ ] Verify all animations are smooth (60fps)

3. **Scroll Behavior**
   - [ ] Scroll down a long doc
   - [ ] Verify sidebar stays fixed
   - [ ] Verify TOC stays fixed (desktop)
   - [ ] Navigate to new doc
   - [ ] Verify scroll resets to top

## Sample URLs to Test

### Getting Started
- http://localhost:5173/docs/getting-started/introduction.md
- http://localhost:5173/docs/getting-started/quick-start.md
- http://localhost:5173/docs/getting-started/your-first-component.md

### Learn (Core Concepts)
- http://localhost:5173/docs/learn/components.md
- http://localhost:5173/docs/learn/signals.md
- http://localhost:5173/docs/learn/jsx.md
- http://localhost:5173/docs/learn/effects.md

### Routing
- http://localhost:5173/docs/routing/basics.md
- http://localhost:5173/docs/routing/dynamic-routes.md
- http://localhost:5173/docs/routing/layouts.md

### Advanced
- http://localhost:5173/docs/advanced/ssr.md
- http://localhost:5173/docs/advanced/islands.md
- http://localhost:5173/docs/advanced/resumability.md

### API Reference
- http://localhost:5173/docs/api-reference/core.md
- http://localhost:5173/docs/api-reference/router.md

## Expected Behavior Summary

### ✅ What Should Work
- All 156 docs load and render
- Search finds docs by title
- Sidebar expands/collapses sections
- TOC generates from headings (desktop)
- Code copy buttons work
- Mobile menu works
- Breadcrumbs navigate correctly
- Next/Previous links work
- Smooth animations everywhere
- Fast, instant navigation

### ❌ Known Issues
- Build requires terser package (dev works fine)
- Search is title-only (not full-text)
- No version switching

## Success Criteria

The docs site is successful if:
1. ✅ All 156 docs are accessible
2. ✅ Navigation is intuitive and fast
3. ✅ Search helps find content quickly
4. ✅ Code blocks are easy to copy
5. ✅ Mobile experience is smooth
6. ✅ Layout is professional and polished
7. ✅ Performance is excellent

## Report Issues

If you find bugs or issues:
1. Note the URL where it occurred
2. Describe what happened vs what was expected
3. Include browser/device info
4. Include screenshots if helpful

---

**Happy Testing!** 🚀
