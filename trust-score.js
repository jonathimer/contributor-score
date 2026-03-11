#!/usr/bin/env node

/**
 * GitHub Contributor Trust Score
 *
 * A simple trust score calculator based on public GitHub data.
 * Usage: node trust-score.js <github-username> [--json]
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function fetchGitHub(endpoint) {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'contributor-trust-score'
  };
  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`;
  }

  const response = await fetch(`https://api.github.com${endpoint}`, { headers });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function getUserProfile(username) {
  return fetchGitHub(`/users/${username}`);
}

async function getMergedPRCount(username) {
  const data = await fetchGitHub(`/search/issues?q=author:${username}+type:pr+is:merged&per_page=1`);
  return data.total_count;
}

async function getClosedUnmergedPRCount(username) {
  const data = await fetchGitHub(`/search/issues?q=author:${username}+type:pr+is:closed+is:unmerged&per_page=1`);
  return data.total_count;
}

async function getOpenPRCount(username) {
  const data = await fetchGitHub(`/search/issues?q=author:${username}+type:pr+is:open&per_page=1`);
  return data.total_count;
}

async function getUniqueReposContributed(username) {
  const data = await fetchGitHub(`/search/issues?q=author:${username}+type:pr+is:merged&per_page=100`);
  const repos = new Set(data.items?.map(item => item.repository_url) || []);
  return repos.size;
}

async function getRecentEvents(username) {
  try {
    const data = await fetchGitHub(`/users/${username}/events?per_page=100`);
    return data.length;
  } catch {
    return 0;
  }
}

function calculateScore(data) {
  let score = 0;
  const breakdown = {};

  // 1. Account Age (max 20 points)
  // 5 points per year, capped at 20
  const accountAgeDays = (Date.now() - new Date(data.profile.created_at).getTime()) / (1000 * 60 * 60 * 24);
  const accountAgeYears = accountAgeDays / 365;
  const ageScore = Math.min(Math.round(accountAgeYears * 5), 20);
  score += ageScore;
  breakdown.account_age = {
    value: `${accountAgeYears.toFixed(1)} years`,
    points: ageScore,
    max: 20
  };

  // 2. PR Acceptance Rate (max 30 points)
  const totalPRs = data.mergedPRs + data.closedUnmergedPRs;
  let acceptanceRate = 0;
  let acceptanceScore = 0;
  if (totalPRs > 0) {
    acceptanceRate = data.mergedPRs / totalPRs;
    acceptanceScore = Math.round(acceptanceRate * 30);
  }
  score += acceptanceScore;
  breakdown.pr_acceptance = {
    value: `${(acceptanceRate * 100).toFixed(1)}% (${data.mergedPRs} merged, ${data.closedUnmergedPRs} rejected)`,
    points: acceptanceScore,
    max: 30
  };

  // 3. Contribution Volume (max 15 points)
  // Based on total merged PRs
  const volumeScore = Math.min(Math.round(Math.log10(data.mergedPRs + 1) * 5), 15);
  score += volumeScore;
  breakdown.contribution_volume = {
    value: `${data.mergedPRs} merged PRs`,
    points: volumeScore,
    max: 15
  };

  // 4. Repo Diversity (max 15 points)
  // 1.5 points per unique repo, capped at 15
  const diversityScore = Math.min(Math.round(data.uniqueRepos * 1.5), 15);
  score += diversityScore;
  breakdown.repo_diversity = {
    value: `${data.uniqueRepos} unique repos`,
    points: diversityScore,
    max: 15
  };

  // 5. Social Proof - Followers (max 10 points)
  const followerScore = Math.min(Math.round(Math.log10(data.profile.followers + 1) * 3), 10);
  score += followerScore;
  breakdown.social_proof = {
    value: `${data.profile.followers.toLocaleString()} followers`,
    points: followerScore,
    max: 10
  };

  // 6. Recent Activity (max 10 points)
  const activityScore = Math.min(Math.round(data.recentEvents / 10), 10);
  score += activityScore;
  breakdown.recent_activity = {
    value: `${data.recentEvents} events (90 days)`,
    points: activityScore,
    max: 10
  };

  // Spam Detection Penalties
  let spamPenalty = 0;
  const spamReasons = [];

  // New account with high PR volume across many repos
  if (accountAgeDays < 90 && data.mergedPRs + data.closedUnmergedPRs > 20) {
    spamPenalty += 15;
    spamReasons.push('New account with high PR volume');
  }

  // Very low acceptance rate with high volume
  if (acceptanceRate < 0.3 && totalPRs > 10) {
    spamPenalty += 20;
    spamReasons.push('Low acceptance rate with high volume');
  }

  // High rejection count
  if (data.closedUnmergedPRs > data.mergedPRs && data.closedUnmergedPRs > 10) {
    spamPenalty += 10;
    spamReasons.push('More rejected PRs than merged');
  }

  score = Math.max(0, score - spamPenalty);
  if (spamPenalty > 0) {
    breakdown.spam_penalty = {
      value: spamReasons.join(', '),
      points: -spamPenalty,
      max: 0
    };
  }

  return { score: Math.min(score, 100), breakdown };
}

function getTrustLevel(score) {
  if (score >= 70) return { level: 'HIGH', emoji: '🟢', description: 'Established contributor with strong track record' };
  if (score >= 40) return { level: 'MEDIUM', emoji: '🟡', description: 'Some contribution history, exercise normal review' };
  if (score >= 20) return { level: 'LOW', emoji: '🟠', description: 'Limited history, review carefully' };
  return { level: 'NEW', emoji: '🔴', description: 'New or inactive contributor, thorough review recommended' };
}

async function calculateTrustScore(username) {
  console.error(`Fetching data for @${username}...`);

  // Fetch all data in parallel
  const [profile, mergedPRs, closedUnmergedPRs, openPRs, uniqueRepos, recentEvents] = await Promise.all([
    getUserProfile(username),
    getMergedPRCount(username),
    getClosedUnmergedPRCount(username),
    getOpenPRCount(username),
    getUniqueReposContributed(username),
    getRecentEvents(username)
  ]);

  const data = {
    profile,
    mergedPRs,
    closedUnmergedPRs,
    openPRs,
    uniqueRepos,
    recentEvents
  };

  const { score, breakdown } = calculateScore(data);
  const trustLevel = getTrustLevel(score);

  return {
    username,
    score,
    trustLevel,
    breakdown,
    rawData: {
      accountCreated: profile.created_at,
      followers: profile.followers,
      publicRepos: profile.public_repos,
      mergedPRs,
      closedUnmergedPRs,
      openPRs,
      uniqueReposContributed: uniqueRepos,
      recentEvents
    }
  };
}

function formatOutput(result, jsonOutput = false) {
  if (jsonOutput) {
    return JSON.stringify(result, null, 2);
  }

  const { username, score, trustLevel, breakdown } = result;

  let output = `
╔══════════════════════════════════════════════════════════════╗
║  CONTRIBUTOR SCORE                                      ║
╠══════════════════════════════════════════════════════════════╣
║  @${username.padEnd(56)}║
║  Score: ${score}/100 ${trustLevel.emoji} ${trustLevel.level.padEnd(44)}║
║  ${trustLevel.description.padEnd(58)}║
╠══════════════════════════════════════════════════════════════╣
║  BREAKDOWN                                                    ║
╟──────────────────────────────────────────────────────────────╢`;

  for (const [key, data] of Object.entries(breakdown)) {
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const points = data.points >= 0 ? `+${data.points}` : `${data.points}`;
    output += `\n║  ${label.padEnd(20)} ${points.padStart(4)}/${data.max.toString().padStart(2)}  │ ${data.value.substring(0, 30).padEnd(30)}║`;
  }

  output += `
╚══════════════════════════════════════════════════════════════╝`;

  return output;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const username = args.find(arg => !arg.startsWith('--'));
  const jsonOutput = args.includes('--json');

  if (!username) {
    console.error('Usage: node trust-score.js <github-username> [--json]');
    console.error('');
    console.error('Environment variables:');
    console.error('  GITHUB_TOKEN  - GitHub personal access token (recommended for higher rate limits)');
    process.exit(1);
  }

  try {
    const result = await calculateTrustScore(username);
    console.log(formatOutput(result, jsonOutput));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
