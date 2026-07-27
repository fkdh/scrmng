# Contributing

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>: <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | When to use | Example |
|------|-------------|---------|
| `feat` | New feature | `feat: add pinch-to-zoom in gallery viewer` |
| `fix` | Bug fix | `fix: prevent swipe when zoomed in` |
| `docs` | Documentation only | `docs: update README setup guide` |
| `style` | Formatting, no code change | `fix: resolve eslint warnings` |
| `refactor` | Code restructure, no feature/fix | `refactor: extract touch handlers to custom hook` |
| `chore` | Build, config, dependencies | `chore: update next.js to 16.1` |
| `test` | Adding/updating tests | `test: add swipe gesture unit tests` |

### Rules

- Description in **English**, **lowercase**, **imperative mood**
- No period at the end
- Max **72 characters** for description
- Use body for additional context when needed

### Examples

```
feat: unified ScrapeModal component for dashboard and manga detail
fix: gallery viewer scroll mode input jump
docs: rewrite README with comprehensive features
chore: update dependencies
```

## Branch Naming

| Pattern | Use |
|---------|-----|
| `feat/xxx` | New feature |
| `fix/xxx` | Bug fix |
| `docs/xxx` | Documentation |
| `chore/xxx` | Maintenance |

## Pull Request

1. Create a branch from `dev`
2. Make your changes
3. Run `npm run lint` — must pass
4. Push and open a PR to `dev`
5. Describe what and why in the PR description

## Guardrails — Sensitive Data Prevention

**Never commit:**

- `.env` files
- API keys, tokens, or secrets
- Database passwords or connection strings
- Private URLs or credentials

**Before committing, verify:**

1. `.env` is in `.gitignore`
2. No hardcoded credentials in code (use environment variables)
3. Docs and examples use **placeholders** (`your_username`, `your_password`, `your_database`)
4. Run `git diff --cached` and scan for secrets

**If secrets are accidentally pushed:**

1. **Immediately rotate** the compromised credentials
2. Rewrite history with `git filter-branch` or `git filter-repo`
3. Force push to all affected branches
4. Notify anyone who has cloned the repo

## Development Setup

See [README.md](README.md#setup) for local setup instructions.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
