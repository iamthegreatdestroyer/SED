# SED GitHub Action

GitHub Action for automated code analysis.

## Overview

The SED GitHub Action runs entropy analysis on:

- Pull requests
- Push events
- Scheduled analysis

## Quick Start

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

## Inputs

| Input     | Description         | Default           |
| --------- | ------------------- | ----------------- |
| `base`    | Base commit         | Auto              |
| `head`    | Head commit         | Auto              |
| `include` | Include patterns    | `**/*`            |
| `exclude` | Exclude patterns    | `node_modules/**` |
| `fail-on` | Fail classification | `never`           |
| `comment` | Post PR comment     | `true`            |

## Outputs

| Output            | Description            |
| ----------------- | ---------------------- |
| `total-entropy`   | Total entropy          |
| `average-entropy` | Average per file       |
| `classification`  | Overall classification |
| `json`            | Full JSON result       |

## PR Comments

The action posts analysis results as PR comments:

- Classification badge
- File-by-file breakdown
- Entropy totals

## Quality Gates

Fail builds on high-entropy changes:

```yaml
- uses: sgbilod/sed@v1
  with:
    fail-on: high
```

## See Also

- [GitHub Action Guide](/guide/github-action)
- [Configuration](/guide/configuration)
