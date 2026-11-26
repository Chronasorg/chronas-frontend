#!/usr/bin/env node
/**
 * Applies the chronas.org security headers (security-headers-config.mjs) to
 * CloudFront E2ZHTJ5XV3DHIV. A dry run unless called with --apply and the
 * confirm phrase.
 *
 *   node infra/edge/security-headers.mjs report-only
 *   node infra/edge/security-headers.mjs enforce --apply --confirm "apply chronas.org security headers"
 *   node infra/edge/security-headers.mjs restore <backup.json> --apply --confirm "restore chronas.org security headers"
 *
 * Each mode has its own response headers policy (POLICY_NAMES); applying a
 * mode creates or updates that policy and attaches it to the default
 * behavior. Going back from enforce to report-only is therefore just
 * `report-only --apply`: it attaches the other policy.
 *
 * Before any change the script saves a snapshot to infra/backups/
 * (gitignored): the distribution config and the full config of every
 * chronas.org security headers policy. `restore` puts a snapshot back: first
 * the policies' contents, then the distribution (and with it the attached
 * policy). Uses the AWS CLI with the chronas-prod profile (CHRONAS_AWS_PROFILE
 * overrides it) and refuses any account but 937826731833.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DISTRIBUTION_ID,
  LEGACY_POLICY_NAME,
  POLICY_NAMES,
  policyConfig,
} from './security-headers-config.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = process.env.EDGE_BACKUP_DIR || path.join(HERE, '..', 'backups');
// Not AWS_PROFILE: a shell's default profile may point at another account.
const PROFILE = process.env.CHRONAS_AWS_PROFILE || 'chronas-prod';
const ACCOUNT = '937826731833';
const CONFIRM_APPLY = 'apply chronas.org security headers';
const CONFIRM_RESTORE = 'restore chronas.org security headers';
const OUR_POLICY_NAMES = [...Object.values(POLICY_NAMES), LEGACY_POLICY_NAME];

function aws(args) {
  const out = execFileSync('aws', [...args, '--profile', PROFILE, '--output', 'json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  return out.trim() ? JSON.parse(out) : {};
}

function withTempJson(value, fn) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const dir = fs.mkdtempSync(path.join(BACKUP_DIR, 'tmp-'));
  const file = path.join(dir, 'input.json');
  fs.writeFileSync(file, JSON.stringify(value));
  try {
    return fn(`file://${file}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function checkAccount() {
  const { Account } = aws(['sts', 'get-caller-identity']);
  if (Account !== ACCOUNT)
    throw new Error(`profile ${PROFILE} is account ${Account}, not ${ACCOUNT}`);
}

/**
 * CloudFront returns the sections a policy doesn't use as empty objects
 * (`XSSProtection: {}`), and refuses them when they are sent back. Drops
 * empty objects and nulls, recursively, so a read config can be written.
 */
export function writableConfig(value) {
  if (Array.isArray(value)) return value.map(writableConfig);
  if (value === null || typeof value !== 'object') return value;
  const out = {};
  for (const [key, child] of Object.entries(value)) {
    const cleaned = writableConfig(child);
    if (cleaned === null || cleaned === undefined) continue;
    if (typeof cleaned === 'object' && !Array.isArray(cleaned) && Object.keys(cleaned).length === 0)
      continue;
    out[key] = cleaned;
  }
  return out;
}

/** Our policies by name: { name: { id, config } }. */
function ourPolicies() {
  const list = aws(['cloudfront', 'list-response-headers-policies', '--type', 'custom']);
  const byName = {};
  for (const item of list.ResponseHeadersPolicyList?.Items || []) {
    const { Id, ResponseHeadersPolicyConfig: config } = item.ResponseHeadersPolicy;
    if (OUR_POLICY_NAMES.includes(config.Name))
      byName[config.Name] = { id: Id, config: writableConfig(config) };
  }
  return byName;
}

/** Saves the distribution config and our policies' configs; returns them. */
function snapshot() {
  const distribution = aws(['cloudfront', 'get-distribution-config', '--id', DISTRIBUTION_ID]);
  const policies = {};
  for (const { id, config } of Object.values(ourPolicies())) policies[id] = config;
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const file = path.join(
    BACKUP_DIR,
    `${new Date().toISOString().replace(/[:.]/g, '-')}-${DISTRIBUTION_ID}-security-headers.json`
  );
  const saved = { takenAt: new Date().toISOString(), distribution, policies };
  fs.writeFileSync(file, JSON.stringify(saved, null, 2));
  return { ...saved, file };
}

function updatePolicy(id, config) {
  const { ETag } = aws(['cloudfront', 'get-response-headers-policy', '--id', id]);
  withTempJson(config, (input) =>
    aws([
      'cloudfront',
      'update-response-headers-policy',
      '--id',
      id,
      '--if-match',
      ETag,
      '--response-headers-policy-config',
      input,
    ])
  );
}

// Reads the ETag just before writing: updating a policy that is attached to
// the distribution changes the distribution's ETag too.
function updateDistribution(distributionConfig) {
  const { ETag } = aws(['cloudfront', 'get-distribution-config', '--id', DISTRIBUTION_ID]);
  withTempJson(distributionConfig, (input) =>
    aws([
      'cloudfront',
      'update-distribution',
      '--id',
      DISTRIBUTION_ID,
      '--if-match',
      ETag,
      '--distribution-config',
      input,
    ])
  );
}

function parseArgs(argv) {
  const [command, arg] = argv;
  const apply = argv.includes('--apply');
  const confirmAt = argv.indexOf('--confirm');
  const confirm = confirmAt >= 0 ? argv[confirmAt + 1] : undefined;
  return { command, arg, apply, confirm };
}

function applyMode(mode, { apply, confirm }) {
  const config = policyConfig(mode);
  const policies = ourPolicies();
  // The first policy (2026-11-26) had no mode in its name and held the
  // report-only CSP; report-only takes it over and renames it.
  const existing =
    policies[config.Name] ?? (mode === 'report-only' ? policies[LEGACY_POLICY_NAME] : undefined);
  const saved = snapshot();
  const behavior = saved.distribution.DistributionConfig.DefaultCacheBehavior;

  console.log(`Snapshot ${path.relative(process.cwd(), saved.file)}`);
  console.log(
    `Policy ${config.Name}: ${existing ? `update ${existing.id}` : 'create'} (CSP ${mode})`
  );
  console.log(JSON.stringify(config, null, 2));
  console.log(
    `Default behavior of ${DISTRIBUTION_ID}: ${behavior.ResponseHeadersPolicyId || 'none'}` +
      (existing && behavior.ResponseHeadersPolicyId === existing.id
        ? ' (already this policy)'
        : ` -> ${existing ? existing.id : 'the new policy'}`)
  );

  if (!apply) {
    console.log(`\nDry run. To apply: --apply --confirm "${CONFIRM_APPLY}"`);
    return;
  }
  if (confirm !== CONFIRM_APPLY) throw new Error(`--confirm must be "${CONFIRM_APPLY}"`);

  let id = existing?.id;
  if (id) {
    updatePolicy(id, config);
    console.log(`Updated policy ${id}`);
  } else {
    const created = withTempJson(config, (input) =>
      aws([
        'cloudfront',
        'create-response-headers-policy',
        '--response-headers-policy-config',
        input,
      ])
    );
    id = created.ResponseHeadersPolicy.Id;
    console.log(`Created policy ${id}`);
  }

  if (behavior.ResponseHeadersPolicyId !== id) {
    behavior.ResponseHeadersPolicyId = id;
    updateDistribution(saved.distribution.DistributionConfig);
    console.log(`Attached policy ${id} to the default behavior of ${DISTRIBUTION_ID}`);
  }
  console.log('CloudFront deploys the change to its edge locations within a few minutes.');
}

function restore(backupFile, { apply, confirm }) {
  if (!backupFile) throw new Error('restore needs a snapshot file');
  const target = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
  if (!target.distribution || !target.policies) {
    throw new Error(`${backupFile} is not a security headers snapshot`);
  }
  const current = snapshot();
  const attached = (s) =>
    s.distribution.DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId;

  console.log(
    `Restore from ${backupFile} (current state saved to ${path.relative(process.cwd(), current.file)})`
  );
  const policyChanges = Object.entries(target.policies).filter(
    ([id, config]) =>
      JSON.stringify(current.policies[id]) !== JSON.stringify(writableConfig(config))
  );
  for (const [id, config] of policyChanges) {
    console.log(
      `Policy ${id}: ${current.policies[id] ? 'restore its config' : 'gone, cannot restore'} (${config.Name})`
    );
  }
  console.log(`Attached policy: ${attached(current) || 'none'} -> ${attached(target) || 'none'}`);

  if (!apply) {
    console.log(`\nDry run. To restore: --apply --confirm "${CONFIRM_RESTORE}"`);
    return;
  }
  if (confirm !== CONFIRM_RESTORE) throw new Error(`--confirm must be "${CONFIRM_RESTORE}"`);

  for (const [id, config] of policyChanges) {
    if (!current.policies[id]) throw new Error(`policy ${id} no longer exists; restore stopped`);
    updatePolicy(id, writableConfig(config));
    console.log(`Restored policy ${id}`);
  }
  updateDistribution(target.distribution.DistributionConfig);
  console.log(`Restored the distribution config of ${DISTRIBUTION_ID}.`);
}

const args = parseArgs(process.argv.slice(2));
try {
  if (['report-only', 'enforce', 'restore'].includes(args.command)) checkAccount();
  if (args.command === 'report-only' || args.command === 'enforce') applyMode(args.command, args);
  else if (args.command === 'restore') restore(args.arg, args);
  else {
    console.error(
      'Usage: security-headers.mjs report-only|enforce|restore <snapshot.json> [--apply --confirm "<phrase>"]'
    );
    process.exitCode = 2;
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
}
