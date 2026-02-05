#!/usr/bin/env python3
import re

file_path = r's:\SED\packages\core\src\semantic\parser.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Remove parseTime from parse() method return
# Remove 'parseTime,' from return object
content = re.sub(r'\s+parseTime,\n', '\n', content)
# Remove 'parseTime,' from metadata object
content = re.sub(r'\s+parseTime,\n', '\n', content)
# Remove duplicate language from metadata
content = re.sub(r'\s+language:\s+resolvedLanguage,\n\s+\},', '\n        },', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Removed parseTime references from parse() method")
