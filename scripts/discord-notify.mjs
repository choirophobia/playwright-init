// scripts/discord-notify.mjs
//
// Reads the Playwright JSON reporter output (playwright-report/results.json, see
// playwright.config.ts) and posts a Discord notification listing pass/fail/skip
// counts per browser project, instead of just an overall pass/fail. See README:
// Continuous Integration.
//
// Usage: node scripts/discord-notify.mjs [--dry-run] [path-to-results.json]
// Env vars (set by .github/workflows/playwright.yml): DISCORD_WEBHOOK, JOB_STATUS,
// BRANCH, RUN_URL.

import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const resultsPath = args.find((a) => !a.startsWith('--')) ?? 'playwright-report/results.json';

// Projects are grouped to match how README: Test Coverage already presents the
// suite, so the Discord message reads the same way the docs do.
const FUNCTIONAL_PROJECTS = ['chromium', 'firefox', 'webkit', 'Mobile Chrome', 'Mobile Safari'];
const BDD_PROJECTS = ['bdd-chromium', 'bdd-firefox', 'bdd-webkit', 'bdd-chromium-auth', 'bdd-firefox-auth', 'bdd-webkit-auth'];

function collectProjectStats(report) {
  const stats = new Map();

  const bump = (name, key) => {
    if (!stats.has(name)) stats.set(name, { passed: 0, failed: 0, flaky: 0, skipped: 0 });
    stats.get(name)[key]++;
  };

  const walk = (suite) => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const name = test.projectName || 'unknown';
        if (test.status === 'expected') bump(name, 'passed');
        else if (test.status === 'unexpected') bump(name, 'failed');
        else if (test.status === 'flaky') bump(name, 'flaky');
        else if (test.status === 'skipped') bump(name, 'skipped');
      }
    }
    for (const child of suite.suites ?? []) walk(child);
  };

  for (const suite of report.suites ?? []) walk(suite);
  return stats;
}

function formatProjectLine(stats, name) {
  const s = stats.get(name);
  if (!s) return `⚪ **${name}**: no tests ran`;

  const total = s.passed + s.failed + s.flaky + s.skipped;
  const icon = s.failed > 0 ? '❌' : '✅';
  const parts = [];
  if (s.passed) parts.push(`${s.passed} passed`);
  if (s.flaky) parts.push(`${s.flaky} flaky`);
  if (s.failed) parts.push(`${s.failed} failed`);
  if (s.skipped) parts.push(`${s.skipped} skipped`);

  return `${icon} **${name}**: ${parts.join(', ')} (${total})`;
}

function buildPayload(report) {
  const stats = collectProjectStats(report);
  const anyFailed = [...stats.values()].some((s) => s.failed > 0);
  const success = process.env.JOB_STATUS === 'success' && !anyFailed;

  const title = success ? '✅ Playwright Tests passed' : '❌ Playwright Tests failed';
  const color = success ? 3066993 : 15158332;
  const branch = process.env.BRANCH ?? 'unknown';
  const runUrl = process.env.RUN_URL ?? '';

  return {
    embeds: [
      {
        title,
        color,
        description: `Branch: \`${branch}\`\nRun: ${runUrl}`,
        fields: [
          {
            name: 'Desktop & Mobile Browsers',
            value: FUNCTIONAL_PROJECTS.map((name) => formatProjectLine(stats, name)).join('\n'),
          },
          {
            name: 'BDD (Cucumber) Browsers',
            value: BDD_PROJECTS.map((name) => formatProjectLine(stats, name)).join('\n'),
          },
        ],
      },
    ],
  };
}

async function main() {
  const report = JSON.parse(readFileSync(resultsPath, 'utf8'));
  const payload = buildPayload(report);

  if (dryRun) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const webhook = process.env.DISCORD_WEBHOOK;
  if (!webhook) {
    // GitHub withholds repo secrets from Dependabot-triggered runs — skip quietly
    // instead of failing the job over a notification, not the actual test result.
    console.log('DISCORD_WEBHOOK not set (likely a Dependabot PR run) — skipping notification.');
    return;
  }

  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Discord webhook responded ${res.status}: ${await res.text()}`);
  }

  console.log('Discord notification sent.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
