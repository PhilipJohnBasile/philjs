#!/usr/bin/env python3
import os
import re
from pathlib import Path
import json

def analyze_file(file_path):
    """Analyze a markdown file for content quality."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        return {
            'error': True,
            'word_count': 0,
            'status': 'ERROR'
        }

    # Basic metrics
    word_count = len(content.split())
    line_count = len(content.split('\n'))
    char_count = len(content)

    # Count code blocks
    code_blocks = re.findall(r'```[\s\S]*?```', content)
    code_block_count = len(code_blocks)

    # Check for imports in code blocks
    has_imports = any('import' in block for block in code_blocks)

    # Count headings
    headings = re.findall(r'^#+\s+.+$', content, re.MULTILINE)
    heading_count = len(headings)

    # Check for common placeholder patterns
    placeholders = [
        'TODO', 'TBD', 'Coming soon', 'To be documented',
        'Placeholder', 'Work in progress', 'WIP'
    ]
    has_placeholders = any(p.lower() in content.lower() for p in placeholders)

    # Determine status
    if word_count == 0:
        status = 'EMPTY'
    elif word_count < 50:
        status = 'SKELETON'
    elif word_count < 200 and heading_count > word_count / 10:
        status = 'OUTLINE_ONLY'
    elif word_count < 300:
        status = 'MINIMAL'
    elif word_count < 800:
        status = 'PARTIAL'
    elif word_count >= 800:
        status = 'COMPLETE'
    else:
        status = 'UNKNOWN'

    # Check content quality
    has_examples = code_block_count > 0
    has_substantial_text = word_count > 100 and (word_count - heading_count * 3) > 80

    return {
        'word_count': word_count,
        'line_count': line_count,
        'char_count': char_count,
        'heading_count': heading_count,
        'code_block_count': code_block_count,
        'has_imports': has_imports,
        'has_placeholders': has_placeholders,
        'has_examples': has_examples,
        'has_substantial_text': has_substantial_text,
        'status': status,
        'error': False
    }

def main():
    docs_dir = Path('/Users/pjb/Git/philjs/docs')

    # Sections to analyze
    sections = [
        'getting-started',
        'learn',
        'data-fetching',
        'forms',
        'routing',
        'styling',
        'performance',
        'advanced',
        'api-reference',
        'best-practices',
        'migration',
        'troubleshooting'
    ]

    results = {}

    for section in sections:
        section_dir = docs_dir / section
        if not section_dir.exists():
            continue

        results[section] = {}

        for md_file in sorted(section_dir.glob('*.md')):
            file_name = md_file.name
            analysis = analyze_file(md_file)
            results[section][file_name] = analysis

    # Output as JSON
    print(json.dumps(results, indent=2))

if __name__ == '__main__':
    main()
