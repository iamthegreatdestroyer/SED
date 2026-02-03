# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in SED, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Email security concerns to: sgbilod@proton.me
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide a detailed response within 7 days.

## Security Considerations

### Code Analysis

SED analyzes source code but does not execute it. However:

- Maliciously crafted code files could potentially cause excessive memory usage
- Large or deeply nested ASTs may cause performance issues
- The embedding model processes code text which should be sanitized

### API Security

For the web API (`apps/web`):

- Implement rate limiting
- Validate all input sizes
- Use authentication for sensitive endpoints
- Sanitize file paths to prevent directory traversal

### Extension Security

The VS Code extension:

- Only reads files within the workspace
- Does not transmit code externally (unless configured)
- Follows VS Code security guidelines

## Best Practices

When deploying SED:

1. Keep dependencies updated (`pnpm update`)
2. Review Dependabot alerts
3. Use the latest stable release
4. Limit API access to trusted sources

## Acknowledgments

We appreciate responsible disclosure and will acknowledge security researchers who report valid
vulnerabilities.
