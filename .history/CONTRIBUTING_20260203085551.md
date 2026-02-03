# Contributing to SED

Thank you for your interest in contributing to Semantic Entropy Differencing!

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 8+
- Git

### Getting Started

```bash
# Clone the repository
git clone https://github.com/iamthegreatdestroyer/SED.git
cd SED

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Start development mode
pnpm dev
```

## Project Structure

- `apps/` - Application packages (CLI, VS Code extension, web)
- `packages/` - Shared libraries (core engine, git integration)
- `docs/` - Documentation
- `scripts/` - Build and utility scripts

## Coding Standards

### TypeScript

- Use strict mode (`strict: true`)
- Prefer explicit types for public APIs
- Use JSDoc comments for documentation
- Follow the existing code style

### Commits

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:

```
feat(core): add KL divergence calculation for embeddings
fix(cli): handle missing git repository gracefully
docs(readme): update installation instructions
```

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Make your changes
4. Run tests (`pnpm test`)
5. Run linting (`pnpm lint`)
6. Commit using conventional commits
7. Push to your fork
8. Open a Pull Request

### Code Review

- All PRs require at least one approval
- CI must pass before merging
- Squash merging is preferred for cleaner history

## Entropy Calculations

When implementing entropy-related features, ensure:

1. Mathematical formulas match the specification
2. Test with known input/output pairs
3. Document any approximations or assumptions
4. Consider numerical stability (avoid log(0))

## Testing

- Write unit tests for new functionality
- Aim for >90% code coverage in core
- Include test fixtures for entropy calculations
- Use `vitest` for testing

## Documentation

- Update relevant documentation for changes
- Include JSDoc comments for public APIs
- Add examples for new features

## Questions?

Open an issue or discussion on GitHub!
