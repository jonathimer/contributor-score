# Contributor Score

A simple trust score calculator for GitHub contributors. Helps maintainers identify potentially low-quality or spam contributions by analyzing public GitHub data.

## The Problem

Open source projects are seeing a growing influx of low-quality, AI-generated pull requests. Maintainers are stuck playing whack-a-mole, manually reviewing and blocking obvious bots.

## The Solution

A trust score based on publicly available GitHub data that helps maintainers:
- Prioritize PR reviews
- Identify potential spam quickly
- Welcome new contributors while staying vigilant

## Score Components

| Signal | Weight | Description |
|--------|--------|-------------|
| Account Age | 20 pts | Older accounts are more trustworthy |
| PR Acceptance Rate | 30 pts | History of merged vs rejected PRs |
| Contribution Volume | 15 pts | Total merged PRs (logarithmic scale) |
| Repo Diversity | 15 pts | Contributions across multiple repos |
| Social Proof | 10 pts | Follower count (logarithmic scale) |
| Recent Activity | 10 pts | Activity in the last 90 days |
| Spam Penalty | -20 pts | New accounts with suspicious patterns |

## Trust Levels

- 🟢 **HIGH** (70-100): Established contributor with strong track record
- 🟡 **MEDIUM** (40-69): Some contribution history, exercise normal review
- 🟠 **LOW** (20-39): Limited history, review carefully
- 🔴 **NEW** (0-19): New or inactive contributor, thorough review recommended

## Usage

### CLI

```bash
# Set your GitHub token for higher rate limits
export GITHUB_TOKEN=ghp_xxxxx

# Check a contributor
node trust-score.js <username>

# JSON output
node trust-score.js <username> --json
```

### GitHub Action

Add to your repository's `.github/workflows/trust-score.yml`:

```yaml
name: PR Trust Score

on:
  pull_request:
    types: [opened, reopened]

jobs:
  trust-score:
    runs-on: ubuntu-latest
    steps:
      - uses: jonathimer/contributor-trust-score@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          add-comment: true
          add-label: true
```

### Action Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `github-token` | GitHub token for API access | `${{ github.token }}` |
| `username` | Username to check (defaults to PR author) | PR author |
| `add-comment` | Add a comment with the score | `true` |
| `add-label` | Add a trust label to the PR | `true` |
| `fail-below` | Fail if score is below threshold | `0` (disabled) |

### Action Outputs

| Output | Description |
|--------|-------------|
| `score` | The calculated trust score (0-100) |
| `level` | Trust level (HIGH, MEDIUM, LOW, NEW) |
| `username` | The GitHub username that was checked |

## Example Output

```
╔══════════════════════════════════════════════════════════════╗
║  CONTRIBUTOR TRUST SCORE                                      ║
╠══════════════════════════════════════════════════════════════╣
║  @torvalds                                                    ║
║  Score: 79/100 🟢 HIGH                                        ║
║  Established contributor with strong track record             ║
╠══════════════════════════════════════════════════════════════╣
║  BREAKDOWN                                                    ║
╟──────────────────────────────────────────────────────────────╢
║  Account Age           +20/20  │ 14.5 years                   ║
║  Pr Acceptance         +25/30  │ 84.7% (72 merged, 13 rejected║
║  Contribution Volume    +9/15  │ 72 merged PRs                ║
║  Repo Diversity         +5/15  │ 3 unique repos               ║
║  Social Proof          +10/10  │ 289,836 followers            ║
║  Recent Activity       +10/10  │ 99 events (90 days)          ║
╚══════════════════════════════════════════════════════════════╝
```

## Limitations

- **New contributors**: The system is designed to flag new contributors, but that doesn't mean they're untrustworthy. New contributors are welcome! The score is just one signal for maintainers.
- **90-day event window**: GitHub's Events API only returns the last 90 days of activity.
- **Rate limits**: GitHub API has rate limits (5,000/hour authenticated, 60/hour unauthenticated). Use a token for best results.

## Future Enhancements

- Integration with LFX Insights for historical data beyond 90 days
- Cross-project reputation from LF projects
- Maintainer endorsements
- Organization verification

## License

Apache 2.0 - jonathimer
