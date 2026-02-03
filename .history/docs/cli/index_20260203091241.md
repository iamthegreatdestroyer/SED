# CLI Usage

Complete reference for the SED command-line interface.

## Installation

::: code-group

```bash [npm]
npm install -g @sed/cli
```

```bash [pnpm]
pnpm add -g @sed/cli
```

```bash [Homebrew]
brew install sed
```

:::

## Commands

### sed analyze

Analyze changes between two commits.

```bash
sed analyze [from] [to] [options]
```

**Arguments:**

| Argument | Description             | Default  |
| -------- | ----------------------- | -------- |
| `from`   | Base commit reference   | `HEAD~1` |
| `to`     | Target commit reference | `HEAD`   |

**Options:**

| Option              | Alias | Description                          |
| ------------------- | ----- | ------------------------------------ |
| `--format <type>`   | `-f`  | Output format (text, json, markdown) |
| `--output <file>`   | `-o`  | Write output to file                 |
| `--include <globs>` | `-i`  | Include patterns                     |
| `--exclude <globs>` | `-e`  | Exclude patterns                     |
| `--verbose`         | `-v`  | Verbose output                       |
| `--quiet`           | `-q`  | Suppress output                      |
| `--no-color`        |       | Disable colors                       |

**Examples:**

```bash
# Analyze last commit
sed analyze

# Analyze specific range
sed analyze abc123 def456

# Compare branches
sed analyze main feature-branch

# JSON output to file
sed analyze HEAD~5 HEAD --format json --output report.json

# Include only TypeScript files
sed analyze --include "**/*.ts" --exclude "**/*.test.ts"
```

### sed compare

Compare two branches.

```bash
sed compare [branch1] [branch2] [options]
```

**Arguments:**

| Argument  | Description   | Default        |
| --------- | ------------- | -------------- |
| `branch1` | First branch  | Current branch |
| `branch2` | Second branch | `main`         |

**Examples:**

```bash
# Compare current to main
sed compare

# Compare two branches
sed compare feature-a feature-b

# Show only high entropy files
sed compare main --min-entropy 3.0
```

### sed watch

Watch for file changes and analyze.

```bash
sed watch [path] [options]
```

**Arguments:**

| Argument | Description        | Default |
| -------- | ------------------ | ------- |
| `path`   | Directory to watch | `.`     |

**Options:**

| Option              | Alias | Description            |
| ------------------- | ----- | ---------------------- |
| `--include <globs>` | `-i`  | Include patterns       |
| `--exclude <globs>` | `-e`  | Exclude patterns       |
| `--debounce <ms>`   | `-d`  | Debounce delay         |
| `--clear`           | `-c`  | Clear screen on change |

**Examples:**

```bash
# Watch current directory
sed watch

# Watch specific directory
sed watch ./src

# Watch with filtering
sed watch ./src --include "**/*.ts" --exclude "**/*.test.ts"
```

### sed report

Generate a report for a range of commits.

```bash
sed report [from] [to] [options]
```

**Options:**

| Option              | Description                         |
| ------------------- | ----------------------------------- |
| `--format <type>`   | Report format (html, markdown, pdf) |
| `--output <file>`   | Output file path                    |
| `--title <title>`   | Report title                        |
| `--include-changes` | Include change details              |

**Examples:**

```bash
# Generate HTML report
sed report v1.0.0 v1.1.0 --format html --output report.html

# Markdown for PR
sed report HEAD~10 HEAD --format markdown
```

### sed history

Show entropy history over time.

```bash
sed history [options]
```

**Options:**

| Option            | Description       |
| ----------------- | ----------------- |
| `--limit <n>`     | Number of commits |
| `--since <date>`  | Start date        |
| `--until <date>`  | End date          |
| `--format <type>` | Output format     |

**Examples:**

```bash
# Last 10 commits
sed history --limit 10

# Last month
sed history --since "1 month ago"

# JSON output
sed history --format json
```

### sed config

Manage configuration.

```bash
sed config <subcommand> [options]
```

**Subcommands:**

- `init` - Create configuration file
- `show` - Display current configuration
- `set <key> <value>` - Set configuration value
- `get <key>` - Get configuration value

**Examples:**

```bash
# Initialize config
sed config init

# Show current config
sed config show

# Set threshold
sed config set thresholds.high 4.0
```

## Global Options

These options work with all commands:

| Option            | Description         |
| ----------------- | ------------------- |
| `--config <path>` | Path to config file |
| `--cwd <path>`    | Working directory   |
| `--help`          | Show help           |
| `--version`       | Show version        |

## Output Formats

### Text (Default)

Human-readable terminal output with colors and formatting.

```
📊 SED Analysis Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Files Analyzed: 5
Total Entropy:  12.45
Classification: MEDIUM

FILE ANALYSIS:

  src/index.ts                    [MEDIUM]    3.21
    ├─ + function handleRequest   2.15
    └─ ~ class Server             1.06
```

### JSON

Machine-readable JSON output.

```bash
sed analyze --format json
```

```json
{
  "from": "abc123",
  "to": "def456",
  "files": [...],
  "summary": {...}
}
```

### Markdown

Markdown-formatted output for documentation or PRs.

```bash
sed analyze --format markdown
```

```markdown
# SED Analysis Report

## Summary

| Metric         | Value  |
| -------------- | ------ |
| Files          | 5      |
| Total Entropy  | 12.45  |
| Classification | MEDIUM |
```

## Configuration File

Create `.sedrc.json` in your project root:

```json
{
  "include": ["src/**/*.ts", "lib/**/*.ts"],
  "exclude": ["**/*.test.ts", "node_modules/**"],
  "thresholds": {
    "trivial": 0.5,
    "low": 1.5,
    "medium": 3.0,
    "high": 4.5
  },
  "output": {
    "format": "text",
    "colors": true,
    "verbose": false
  }
}
```

## Environment Variables

| Variable       | Description           |
| -------------- | --------------------- |
| `SED_CONFIG`   | Path to config file   |
| `SED_NO_COLOR` | Disable colors        |
| `SED_VERBOSE`  | Enable verbose output |

## Exit Codes

| Code | Meaning                   |
| ---- | ------------------------- |
| `0`  | Success                   |
| `1`  | Error                     |
| `2`  | Critical entropy exceeded |
| `3`  | High entropy exceeded     |
| `4`  | Medium entropy exceeded   |

## Examples

### CI/CD Integration

```bash
# Fail if critical changes detected
sed analyze HEAD~1 HEAD --fail-on critical

# Exit code based on classification
if ! sed analyze --quiet; then
  echo "High entropy changes detected"
  exit 1
fi
```

### Scripting

```bash
# Get entropy as number
entropy=$(sed analyze --format json | jq '.summary.totalEntropy')

# Check threshold
if (( $(echo "$entropy > 10" | bc -l) )); then
  echo "High entropy: $entropy"
fi
```

### Git Hooks

```bash
# .git/hooks/pre-commit
#!/bin/sh
sed analyze --staged --fail-on high
```

## See Also

- [Getting Started](/guide/getting-started)
- [Configuration](/guide/configuration)
- [API Reference](/api/)
