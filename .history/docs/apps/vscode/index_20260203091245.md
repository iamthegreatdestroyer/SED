# SED VS Code Extension

Visual Studio Code extension for entropy analysis.

## Overview

The VS Code extension integrates SED directly into your editor:

- Inline annotations
- Explorer panel
- CodeLens integration
- Real-time analysis

## Installation

Search for "SED" in VS Code Extensions, or:

```bash
code --install-extension sgbilod.sed
```

## Features

### Inline Annotations

See entropy values directly in your code.

### Explorer Panel

View changed files, history, and summary.

### CodeLens

Click function headers for entropy details.

### Hover Information

Hover over changes for breakdown.

## Commands

| Command                    | Description            |
| -------------------------- | ---------------------- |
| `SED: Analyze File`        | Analyze current file   |
| `SED: Analyze Workspace`   | Analyze all changes    |
| `SED: Compare with Branch` | Compare current branch |
| `SED: Toggle Annotations`  | Toggle annotations     |

## Settings

| Setting                   | Description             | Default  |
| ------------------------- | ----------------------- | -------- |
| `sed.enabled`             | Enable extension        | `true`   |
| `sed.annotations.enabled` | Show annotations        | `true`   |
| `sed.autoAnalyze`         | Auto-analyze on save    | `true`   |
| `sed.compareBase`         | Default comparison base | `HEAD~1` |

## Keyboard Shortcuts

| Shortcut       | Command            |
| -------------- | ------------------ |
| `Ctrl+Shift+E` | Analyze file       |
| `Ctrl+Alt+E`   | Toggle annotations |
| `Ctrl+Shift+H` | Show history       |

## See Also

- [VS Code Extension Guide](/guide/vscode-extension)
- [Configuration](/guide/configuration)
