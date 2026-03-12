# Contributor Score

> **Note:** This is an experiment exploring whether contributor reputation signals can help maintainers triage PRs. The scoring model is a starting point for discussion, not a production-ready solution.

A simple trust score for GitHub contributors. Helps maintainers identify potentially low-quality or spam contributions by analyzing public GitHub data.

## The Problem

Open source projects are seeing a growing influx of low-quality, AI-generated pull requests. Maintainers are stuck playing whack-a-mole, manually reviewing and blocking low quality contributions. If we as an open source community don't find solutions, more and more projects will shut down outside contributions.

Communtiy references: 

- [@mitchellh](https://x.com/mitchellh/status/2018458123632283679?s=20): "For the first time ever, I'm considering closing external PRs to my OSS projects completely. This will throw the baby out with the bathwater and I hate that, but we close auto-opened slop PRs every single day."
- [Jason Bosco](https://www.linkedin.com/posts/jasonbosco_llm-generated-slop-prs-are-going-to-fundamentally-activity-7435716863873150977-HxUO?utm_source=social_share_send&utm_medium=member_desktop_web&rcm=ACoAACQX2REBjZW4PkmUmgybIySGkbCTQIEbMWg): "LLM-generated (slop) PRs are going to fundamentally reshape how open source communities function." 
- [@peer_rich](https://x.com/peer_rich/status/2030743675857162330): "Open source contributions are dead unless things change drastically" 


## The Solution

A trust score based on publicly available GitHub data that helps maintainers:
- Prioritize PR reviews
- Identify potential spam quickly
- Welcome new contributors

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
- 🟡 **MEDIUM** (40-69): Some contribution history, exercise review
- 🟠 **LOW** (20-39): Limited history, consider conducting automated review
- 🔴 **NEW** (0-19): New or inactive account, consider conducting automated review

## Usage

### Website

Check any contributor at [jonathimer.github.io/contributor-score](https://jonathimer.github.io/contributor-score)

### GitHub Action

Automatically check Contributor Score on every PR. Add labels, post comments, and optionally fail checks for low scores.

```yaml
name: Contributor Score
on:
  pull_request:
    types: [opened, reopened]

jobs:
  check-score:
    runs-on: ubuntu-latest
    steps:
      - uses: jonathimer/contributor-score@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          add-label: true
          add-comment: true
          # fail-below: 20  # Optional: fail if score is below threshold
```

#### Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `github-token` | GitHub token for API access | `${{ github.token }}` |
| `add-comment` | Add a comment to the PR with the score | `true` |
| `add-label` | Add a trust label to the PR | `true` |
| `fail-below` | Fail the check if score is below this threshold (0 to disable) | `0` |

#### Outputs

| Output | Description |
|--------|-------------|
| `score` | The calculated trust score (0-100) |
| `level` | Trust level (HIGH, MEDIUM, LOW, NEW) |
| `username` | The GitHub username that was checked |

### CLI

```bash
# Set your GitHub token for higher rate limits
export GITHUB_TOKEN=ghp_xxxxx

# Check a contributor
node trust-score.js <username>

# JSON output
node trust-score.js <username> --json
```

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

- **New contributor bias**: Activity-based scoring penalizes first-time or infrequent contributors who may be perfectly legitimate. This could reduce new contributor conversion.
- **Gaming**: Once scoring signals are known, bad actors will optimize for them. This might shift the problem rather than solving it.
- **Activity ≠ quality**: A spammy contributor can have a great GitHub profile. If maintainers trust the score too heavily, high-scoring low-quality PRs still get through — but now with false assurance.

## Contributing

This is an early-stage experiment and we'd love your input. Here's how you can help:

- **Discuss the scoring model** — Open an [issue](https://github.com/jonathimer/contributor-score/issues) to suggest new signals, weight adjustments, or edge cases we should consider
- **Report bugs** — Found something broken? Let us know
- **Submit PRs** — Fork the repo, make your changes, and open a pull request

Please open an issue before starting work on major changes so we can discuss the approach.

## License

MIT
