// Dieselfde stappe as `npm test`, maar skermkiekies gaan na 'n gitignored gids,
// sodat die opgespoorde PNG's in test-artifacts/ nie herskryf word nie.
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const env = Object.assign({}, process.env, {
  WALLIE_ARTIFACTS_DIR: path.join(root, "test-artifacts", "playwright-output", "skermkiekies"),
});

const steps = [
  "node scripts/proctor-test.js",
  "node scripts/smoke-parse.js",
  "node tests/sql-migration.test.js",
  "npx playwright test",
  "node tests/vraebank-store.test.js",
  "node tests/vraebank.test.js",
  "node tests/preview-guard.test.js",
];

for (const cmd of steps) {
  console.log(`\n>>> ${cmd}`);
  const r = spawnSync(cmd, { cwd: root, env, shell: true, stdio: "inherit" });
  const code = r.status === null ? 1 : r.status;
  if (code !== 0) process.exit(code);
}
