# SED GitHub Action

Analyze code changes in your CI/CD pipeline using Semantic Entropy Differencing.

## Features

- **Automatic Commit Detection** - Automatically detects base/head commits for PRs and pushes
- **Classification-based Failures** - Fail builds when entropy exceeds thresholds
- **PR Comments** - Post analysis results as PR comments
- **GitHub Actions Summary** - Write results to the workflow summary
- **Multiple Output Formats** - Export as JSON or Markdown

## Usage

### Basic Usage

```yaml
name: SED Analysis
on: [pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Required for commit comparison

      - name: Run SED Analysis
        uses: sgbilod/sed@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Advanced Usage

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

      - name: Run SED Analysis
        id: sed
        uses: sgbilod/sed@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          base: ${{ github.event.pull_request.base.sha }}
          head: ${{ github.event.pull_request.head.sha }}
          path: 'src'
          include: '**/*.ts,**/*.tsx'
          exclude: 'node_modules/**,dist/**,**/*.test.ts'
          fail-on: 'high'
          comment: true
          summary: true
          json-output: 'sed-report.json'
          markdown-output: 'sed-report.md'

      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: sed-report
          path: |
            sed-report.json
            sed-report.md

      - name: Check Results
        run: |
          echo "Total Entropy: ${{ steps.sed.outputs.total-entropy }}"
          echo "Classification: ${{ steps.sed.outputs.classification }}"
```

## Inputs

| Input             | Description                                   | Required | Default                           |
| ----------------- | --------------------------------------------- | -------- | --------------------------------- |
| `base`            | Base commit or branch to compare from         | No       | Auto-detected                     |
| `head`            | Head commit or branch to compare to           | No       | Auto-detected                     |
| `path`            | Path to analyze (relative to repository root) | No       | `.`                               |
| `include`         | Glob patterns to include (comma-separated)    | No       | `**/*`                            |
| `exclude`         | Glob patterns to exclude (comma-separated)    | No       | `node_modules/**,dist/**,.git/**` |
| `fail-on`         | Fail if entropy exceeds threshold             | No       | `never`                           |
| `threshold`       | Custom entropy threshold for failure          | No       | -                                 |
| `comment`         | Post analysis as PR comment                   | No       | `true`                            |
| `json-output`     | Output JSON file path                         | No       | -                                 |
| `markdown-output` | Output Markdown file path                     | No       | -                                 |
| `summary`         | Write to GitHub Actions summary               | No       | `true`                            |

### Fail-On Values

| Value      | Description                                   |
| ---------- | --------------------------------------------- |
| `never`    | Never fail the action                         |
| `critical` | Fail if any file has critical entropy         |
| `high`     | Fail if any file has high or critical entropy |
| `medium`   | Fail if average entropy is medium or higher   |
| `low`      | Fail if average entropy is low or higher      |

## Outputs

| Output            | Description                         |
| ----------------- | ----------------------------------- |
| `total-entropy`   | Total entropy of all analyzed files |
| `average-entropy` | Average entropy per file            |
| `files-analyzed`  | Number of files analyzed            |
| `classification`  | Overall classification              |
| `json`            | Full analysis result as JSON string |

## Examples

### Fail on High Entropy

```yaml
- uses: sgbilod/sed@v1
  with:
    fail-on: 'high'
```

### Custom Threshold

```yaml
- uses: sgbilod/sed@v1
  with:
    threshold: '3.5'
    fail-on: 'never' # Use threshold instead of classification
```

### Analyze Specific Path

```yaml
- uses: sgbilod/sed@v1
  with:
    path: 'packages/core'
    include: '**/*.ts'
```

### Compare Specific Commits

```yaml
- uses: sgbilod/sed@v1
  with:
    base: 'main'
    head: 'feature-branch'
```

## Classification Thresholds

| Classification | Entropy Range | Color     |
| -------------- | ------------- | --------- |
| Trivial        | 0.0 - 0.5     | ✅ Green  |
| Low            | 0.5 - 1.5     | 💚 Green  |
| Medium         | 1.5 - 3.0     | 💛 Yellow |
| High           | 3.0 - 4.5     | 🟠 Orange |
| Critical       | 4.5+          | 🔴 Red    |

## License

MIT © Stevo (sgbilod)
