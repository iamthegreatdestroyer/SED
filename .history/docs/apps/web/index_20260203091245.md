# SED Web Dashboard

Web-based dashboard for entropy visualization.

## Overview

The web dashboard provides:

- Interactive visualizations
- Commit history analysis
- Team analytics
- Repository management

## Getting Started

### Self-Hosted

```bash
# Clone and build
git clone https://github.com/sgbilod/sed.git
cd sed/apps/web
pnpm install
pnpm build

# Start server
pnpm start
```

### Docker

```bash
docker run -p 3000:3000 sgbilod/sed-web
```

## Features

### Dashboard

Main overview showing:

- Recent analysis results
- Entropy trends
- Classification distribution

### Repository Analysis

Analyze any connected repository:

- Commit-by-commit breakdown
- File-level entropy
- Historical trends

### Comparison View

Compare branches side-by-side:

- Visual diff
- Entropy heatmap
- Classification summary

### Settings

Configure:

- Thresholds
- Node weights
- Context rules

## API Integration

The dashboard exposes a REST API:

```bash
# Analyze changes
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"from": "HEAD~1", "to": "HEAD"}'
```

## Technology Stack

- Next.js 14
- React 18
- TailwindCSS
- shadcn/ui
- Recharts

## See Also

- [Getting Started](/guide/getting-started)
- [API Reference](/api/)
