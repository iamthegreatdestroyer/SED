# Classification Thresholds

Understanding and customizing SED's classification thresholds.

## Default Thresholds

SED uses these default thresholds:

| Classification | Min Entropy | Max Entropy | Icon |
| -------------- | ----------- | ----------- | ---- |
| Trivial        | 0.0         | 0.5         | ✅   |
| Low            | 0.5         | 1.5         | 💚   |
| Medium         | 1.5         | 3.0         | 💛   |
| High           | 3.0         | 4.5         | 🟠   |
| Critical       | 4.5         | ∞           | 🔴   |

## What Each Level Means

### Trivial (0.0 - 0.5)

**Cosmetic changes only.**

- Whitespace formatting
- Comment updates
- Import reordering
- Trivial variable renames

```diff
- const x = 1;    // old variable
+ const x = 1;    // updated comment
```

**Risk:** Essentially none.

### Low (0.5 - 1.5)

**Minor modifications.**

- Variable/function renames
- String literal changes
- Simple value updates
- Minor condition tweaks

```diff
- const MAX_RETRIES = 3;
+ const MAX_RETRIES = 5;
```

**Risk:** Very low.

### Medium (1.5 - 3.0)

**Moderate logic changes.**

- New utility functions
- Modified business logic
- Added parameters
- Changed algorithms (same complexity)

```diff
function processData(items) {
-   return items.filter(x => x.active);
+   return items
+     .filter(x => x.active)
+     .sort((a, b) => a.priority - b.priority);
}
```

**Risk:** Low to moderate. Worth reviewing.

### High (3.0 - 4.5)

**Significant changes.**

- New features
- Major refactoring
- New classes/modules
- Changed data models

```diff
+ export class PaymentProcessor {
+   constructor(private gateway: Gateway) {}
+
+   async process(payment: Payment): Promise<Result> {
+     const validated = await this.validate(payment);
+     return this.gateway.charge(validated);
+   }
+ }
```

**Risk:** Moderate. Careful review recommended.

### Critical (4.5+)

**Architectural changes.**

- New subsystems
- Fundamental algorithm changes
- Security-critical modifications
- Database schema changes

```diff
+ // Complete rewrite of authentication system
+ export class AuthenticationService {
+   // ... 200+ lines of new security logic
+ }
```

**Risk:** High. Thorough review essential.

## Customizing Thresholds

### In Configuration File

```json
{
  "thresholds": {
    "trivial": 0.3,
    "low": 1.0,
    "medium": 2.5,
    "high": 4.0
  }
}
```

### CLI Override

```bash
sed analyze --threshold 3.5 --fail-on high
```

### Programmatic

```typescript
import { classifyEntropy } from '@sed/core';

const classification = classifyEntropy(2.5, {
  trivial: 0.5,
  low: 1.5,
  medium: 3.0,
  high: 4.5,
});
```

## When to Adjust Thresholds

### Stricter (Lower Values)

Use stricter thresholds when:

- Working on critical systems
- Security-sensitive code
- Regulated industries
- New team members

```json
{
  "thresholds": {
    "trivial": 0.3,
    "low": 0.8,
    "medium": 1.5,
    "high": 2.5
  }
}
```

### Relaxed (Higher Values)

Use relaxed thresholds when:

- Rapid prototyping
- Major refactoring sprints
- Initial development
- Research/experimental code

```json
{
  "thresholds": {
    "trivial": 1.0,
    "low": 2.5,
    "medium": 4.0,
    "high": 6.0
  }
}
```

## Context-Based Thresholds

Different thresholds for different areas:

```json
{
  "thresholds": {
    "trivial": 0.5,
    "low": 1.5,
    "medium": 3.0,
    "high": 4.5
  },
  "contextRules": [
    {
      "pattern": "**/security/**",
      "factor": 0.5,
      "name": "Security code (stricter)"
    },
    {
      "pattern": "**/*.test.ts",
      "factor": 2.0,
      "name": "Tests (relaxed)"
    },
    {
      "pattern": "**/migrations/**",
      "factor": 0.7,
      "name": "Migrations (stricter)"
    }
  ]
}
```

## Industry Presets

### Financial Services

```json
{
  "thresholds": {
    "trivial": 0.3,
    "low": 0.8,
    "medium": 1.5,
    "high": 2.5
  },
  "failOn": "high"
}
```

### Healthcare

```json
{
  "thresholds": {
    "trivial": 0.3,
    "low": 1.0,
    "medium": 2.0,
    "high": 3.0
  },
  "failOn": "critical"
}
```

### Startup/Rapid Development

```json
{
  "thresholds": {
    "trivial": 1.0,
    "low": 2.5,
    "medium": 4.5,
    "high": 7.0
  },
  "failOn": "never"
}
```

## Visualizing Thresholds

```
Entropy Scale:
0.0 ──┬── 0.5 ──┬── 1.5 ──┬── 3.0 ──┬── 4.5 ──┬── ∞
      │         │         │         │         │
      ▼         ▼         ▼         ▼         ▼
   TRIVIAL    LOW      MEDIUM    HIGH    CRITICAL
     ✅        💚        💛        🟠        🔴
```

## Calibrating for Your Team

1. **Start with defaults** for 2-4 weeks
2. **Collect data** on classifications vs. actual risk
3. **Adjust** based on false positives/negatives
4. **Document** your reasoning for future reference

Example analysis:

```bash
# Analyze historical commits
sed history --since "1 month ago" --format json > history.json

# Find commits that caused issues
# Correlate with entropy values
# Adjust thresholds accordingly
```

## See Also

- [Core Concepts](/guide/concepts)
- [Configuration](/guide/configuration)
- [API Reference](/api/core)
