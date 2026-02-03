# SED CLI

Command-line interface for Semantic Entropy Differencing.

## Overview

The SED CLI provides terminal access to:

- Analyze code changes
- Generate reports
- Watch for changes
- CI/CD integration

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

### analyze

Analyze changes between commits.

```bash
sed analyze [from] [to] [options]
```

### compare

Compare two branches.

```bash
sed compare [branch1] [branch2] [options]
```

### watch

Watch for file changes.

```bash
sed watch [path] [options]
```

### report

Generate detailed reports.

```bash
sed report [from] [to] [options]
```

### history

Show entropy history.

```bash
sed history [options]
```

### config

Manage configuration.

```bash
sed config init
sed config show
sed config set <key> <value>
```

## Output Formats

- **text** - Human-readable terminal output
- **json** - Machine-readable JSON
- **markdown** - Markdown for documentation/PRs

## Exit Codes

| Code | Meaning          |
| ---- | ---------------- |
| 0    | Success          |
| 1    | Error            |
| 2    | Critical entropy |
| 3    | High entropy     |
| 4    | Medium entropy   |

## Configuration

Create `.sedrc.json`:

```json
{
  "include": ["src/**/*.ts"],
  "exclude": ["**/*.test.ts"],
  "thresholds": {
    "trivial": 0.5,
    "low": 1.5,
    "medium": 3.0,
    "high": 4.5
  }
}
```

## See Also

- [CLI Usage Guide](/cli/)
- [Configuration](/guide/configuration)
