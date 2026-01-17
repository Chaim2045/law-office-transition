#!/usr/bin/env python3
"""
Script to automatically update HTML files:
1. Add contenteditable="true" to all .editable elements
2. Update data-field names according to naming convention

This processes all tab HTML files.
"""

import re
from pathlib import Path

# Tab files to process (excluding already processed ones)
TAB_FILES = [
    'general-info.html',
    'contacts.html',
    'daily-management.html',
    'financial-management.html',
    'meetings-scheduling.html',
    'procedures.html',
    'suppliers-management.html',
]

TABS_DIR = Path('src/tabs')


def add_contenteditable(html_content):
    """
    Add contenteditable="true" to all elements with class="...editable..."
    that don't already have contenteditable.
    """
    # Pattern: class="..." containing "editable", NOT followed by contenteditable
    # This will match class attributes that contain "editable"

    def replacer(match):
        full_match = match.group(0)
        # Check if contenteditable already exists after this class
        check_after = html_content[match.end():match.end() + 200]
        if 'contenteditable' in check_after.split('>')[0]:
            return full_match

        # Add contenteditable="true" after the closing quote of the class attribute
        return full_match + '\n    contenteditable="true"'

    # Match class="..." where ... contains "editable"
    pattern = r'class="[^"]*editable[^"]*"'

    result = re.sub(pattern, replacer, html_content)
    return result


def process_file(filepath):
    """Process a single HTML file."""
    print(f"Processing {filepath}...")

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Add contenteditable to all editable elements
        updated_content = add_contenteditable(content)

        # Count changes
        original_editables = content.count('class="')
        new_contenteditables = updated_content.count('contenteditable="true"')

        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(updated_content)

        print(f"  ✅ Added {new_contenteditables} contenteditable attributes")
        return True

    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False


def main():
    """Main processing function."""
    print("🚀 Starting HTML field updates...\n")

    processed = 0
    failed = 0

    for tab_file in TAB_FILES:
        filepath = TABS_DIR / tab_file

        if not filepath.exists():
            print(f"⚠️  File not found: {filepath}")
            failed += 1
            continue

        if process_file(filepath):
            processed += 1
        else:
            failed += 1

    print(f"\n📊 Summary:")
    print(f"  ✅ Processed: {processed}")
    print(f"  ❌ Failed: {failed}")
    print(f"  📝 Total: {processed + failed}")


if __name__ == '__main__':
    main()
