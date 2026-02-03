# VS Code Extension

The SED VS Code extension provides integrated entropy analysis directly in your editor.

## Installation

### From Marketplace

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "SED - Semantic Entropy Differencing"
4. Click **Install**

### From Command Line

```bash
code --install-extension sgbilod.sed
```

### From VSIX

Download the `.vsix` file and install:

```bash
code --install-extension sed-0.1.0.vsix
```

## Features

### Inline Annotations

See entropy values directly in your code:

![Inline Annotations](./images/inline-annotations.png)

Changes are annotated with their entropy and classification:

- `✅ 0.2` - Trivial change
- `💚 1.2` - Low entropy
- `💛 2.5` - Medium entropy
- `🟠 3.8` - High entropy
- `🔴 5.2` - Critical entropy

### Explorer View

The SED Explorer panel shows:

- Changed files with entropy
- Classification breakdown
- Commit history analysis

### CodeLens

Click on function/class headers to see:

- Entropy for that symbol
- Change history
- Impact analysis

### Hover Information

Hover over changes for detailed breakdown:

- Entropy calculation
- Node type weights
- Context factors

## Commands

Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P):

| Command | Description |
|---------|-------------|
| `SED: Analyze File` | Analyze current file |
| `SED: Analyze Workspace` | Analyze all changed files |
| `SED: Compare with Branch` | Compare current branch |
| `SED: Show History` | Show entropy history |
| `SED: Toggle Annotations` | Toggle inline annotations |
| `SED: Open Settings` | Open extension settings |

## Settings

Configure in VS Code settings:

### sed.enabled

**Type:** `boolean`  
**Default:** `true`

Enable/disable SED extension.

### sed.annotations.enabled

**Type:** `boolean`  
**Default:** `true`

Show inline annotations.

### sed.annotations.style

**Type:** `'inline' | 'gutter' | 'both'`  
**Default:** `'inline'`

Annotation display style.

### sed.thresholds

**Type:** `object`

Custom classification thresholds.

```json
{
  "sed.thresholds": {
    "trivial": 0.5,
    "low": 1.5,
    "medium": 3.0,
    "high": 4.5
  }
}
```

### sed.colors

**Type:** `object`

Custom colors for classifications.

```json
{
  "sed.colors": {
    "trivial": "#22c55e",
    "low": "#84cc16",
    "medium": "#eab308",
    "high": "#f97316",
    "critical": "#ef4444"
  }
}
```

### sed.exclude

**Type:** `string[]`

Patterns to exclude from analysis.

```json
{
  "sed.exclude": [
    "**/node_modules/**",
    "**/*.test.ts"
  ]
}
```

### sed.compareBase

**Type:** `string`  
**Default:** `'HEAD~1'`

Default base for comparison.

### sed.autoAnalyze

**Type:** `boolean`  
**Default:** `true`

Automatically analyze on file save.

### sed.debounceMs

**Type:** `number`  
**Default:** `500`

Debounce time for auto-analysis.

## Status Bar

The status bar shows:

- Current file entropy
- Classification icon
- Click to show details

## Context Menu

Right-click in editor for:

- **Analyze Selection** - Analyze selected code
- **Show Entropy Details** - Detailed breakdown
- **Compare with Base** - Compare with base commit

## Explorer Panel

### Files View

Lists changed files with:

- Entropy value
- Classification badge
- Click to open file

### History View

Shows commit history with:

- Entropy per commit
- Trend indicators
- Click to show diff

### Summary View

Dashboard showing:

- Total entropy
- File breakdown
- Classification chart

## Keyboard Shortcuts

| Shortcut | Command |
|----------|---------|
| `Ctrl+Shift+E` | Analyze file |
| `Ctrl+Alt+E` | Toggle annotations |
| `Ctrl+Shift+H` | Show history |

Customize in Keyboard Shortcuts settings.

## Themes

SED adapts to your theme, but you can customize:

```json
{
  "workbench.colorCustomizations": {
    "sed.trivialBackground": "#22c55e20",
    "sed.lowBackground": "#84cc1620",
    "sed.mediumBackground": "#eab30820",
    "sed.highBackground": "#f9731620",
    "sed.criticalBackground": "#ef444420"
  }
}
```

## Troubleshooting

### Annotations Not Showing

1. Ensure `sed.enabled` is `true`
2. Check `sed.annotations.enabled`
3. Reload window (Ctrl+Shift+P → "Reload Window")

### High CPU Usage

1. Increase `sed.debounceMs`
2. Add patterns to `sed.exclude`
3. Disable `sed.autoAnalyze`

### Git Errors

1. Ensure you're in a Git repository
2. Check Git is installed and in PATH
3. Try running `sed analyze` in terminal

## Screenshots

### Inline Annotations

Code with entropy annotations showing classification colors.

### Explorer Panel

Side panel showing file list, history, and summary.

### Settings

VS Code settings page for SED configuration.

## See Also

- [Getting Started](/guide/getting-started)
- [CLI Usage](/cli/)
- [Configuration](/guide/configuration)
