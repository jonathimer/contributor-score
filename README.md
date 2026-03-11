# Contributor Score

> **Note:** This is an experimental thesis exploring whether contributor reputation signals can help maintainers triage PRs. The scoring model is a starting point for discussion, not a production-ready solution.

A simple trust score for GitHub contributors. Helps maintainers identify potentially low-quality or spam contributions by analyzing public GitHub data.

## The Problem

Open source projects are seeing a growing influx of low-quality, AI-generated pull requests. Maintainers are stuck playing whack-a-mole, manually reviewing and blocking low quality contributions. If we as an open source community don't find solutions, more and more projects will shut down outside contributions.

Communtiy references: 

- "LLM-generated (slop) PRs are going to fundamentally reshape how open source communities function." [Jason Bosco](https://www.linkedin.com/posts/jasonbosco_llm-generated-slop-prs-are-going-to-fundamentally-activity-7435716863873150977-HxUO?utm_source=social_share_send&utm_medium=member_desktop_web&rcm=ACoAACQX2REBjZW4PkmUmgybIySGkbCTQIEbMWg)
- "Open source contributions are dead unless things change drastically" [@peer_rich](https://x.com/peer_rich/status/2030743675857162330)


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

- **New contributors**: The system is designed to flag new contributors, but that doesn't mean they're untrustworthy. New contributors are welcome! The score is just one signal for maintainers.
- **90-day event window**: GitHub's Events API only returns the last 90 days of activity.
- **Rate limits**: GitHub API has rate limits (5,000/hour authenticated, 60/hour unauthenticated). Use a token for best results.

## Future Enhancements

- GitHub Action for automatic PR scoring
- Integration with LFX Insights for historical data
- Contributor verification

## License

MIT
