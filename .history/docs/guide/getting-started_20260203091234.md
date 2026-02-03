# Getting Started

This guide will help you install and start using SED in your projects.

## Installation

### CLI

The CLI is the quickest way to start using SED:

::: code-group

```bash [npm]
npm install -g @sed/cli
```

```bash [pnpm]
pnpm add -g @sed/cli
```

```bash [yarn]
yarn global add @sed/cli
```

```bash [Homebrew]
brew install sed
```

:::

Verify the installation:

```bash
sed --version
# SED v0.1.0
```

### VS Code Extension

Install the SED extension from the VS Code marketplace:

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "SED"
4. Click Install

Or install from the command line:

```bash
code --install-extension sgbilod.sed
```

### GitHub Action

Add SED to your GitHub workflow:

```yaml
name: SED Analysis
on: [pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: sgbilod/sed@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Basic Usage

### Analyze Recent Changes

```bash
# Analyze the last commit
sed analyze HEAD~1 HEAD

# Analyze uncommitted changes
sed analyze HEAD
```

### Compare Branches

```bash
# Compare current branch to main
sed compare main

# Compare two specific branches
sed compare main feature-branch
```

### Watch Mode

```bash
# Watch for file changes
sed watch ./src
```

## Understanding Output

SED outputs analysis in several formats:

### Terminal Output

```
📊 SED Analysis Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Comparing: abc1234 → def5678

Files Analyzed: 5
Total Entropy:  12.45
Avg Entropy:    2.49
Classification: MEDIUM

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FILE ANALYSIS:

  src/index.ts                    [MEDIUM]    3.21
    ├─ + function handleRequest   2.15
    └─ ~ class Server             1.06

  src/utils.ts                    [LOW]       1.24
    └─ ~ function formatDate      1.24

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### JSON Output

```bash
sed analyze HEAD~1 HEAD --format json > report.json
```

```json
{
  "from": "abc1234",
  "to": "def5678",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "files": [
    {
      "relativePath": "src/index.ts",
      "classification": "medium",
      "entropy": 3.21,
      "changes": [...]
    }
  ],
  "summary": {
    "totalFiles": 5,
    "totalEntropy": 12.45,
    "averageEntropy": 2.49
  }
}
```

### Markdown Output

```bash
sed analyze HEAD~1 HEAD --format markdown > report.md
```

## Classification Thresholds

SED classifies changes based on entropy:

| Classification | Entropy   | Icon | Meaning                                |
| -------------- | --------- | ---- | -------------------------------------- |
| Trivial        | 0.0 - 0.5 | ✅   | Minimal impact (formatting, comments)  |
| Low            | 0.5 - 1.5 | 💚   | Minor changes (renames, simple fixes)  |
| Medium         | 1.5 - 3.0 | 💛   | Moderate changes (logic modifications) |
| High           | 3.0 - 4.5 | 🟠   | Significant changes (new features)     |
| Critical       | 4.5+      | 🔴   | Major changes (architectural)          |

## Configuration

Create a `.sedrc.json` file in your project root:

```json
{
  "include": ["src/**/*.ts", "lib/**/*.ts"],
  "exclude": ["**/*.test.ts", "**/__mocks__/**"],
  "thresholds": {
    "trivial": 0.5,
    "low": 1.5,
    "medium": 3.0,
    "high": 4.5
  }
}
```

## Next Steps

- [Core Concepts](/guide/concepts) - Understand how entropy analysis works
- [CLI Usage](/guide/cli-usage) - Full CLI reference
- [VS Code Extension](/guide/vscode-extension) - Editor integration guide
- [GitHub Action](/guide/github-action) - CI/CD setup
