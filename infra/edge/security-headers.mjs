#!/usr/bin/env node
/**
 * Applies the chronas.org security headers (security-headers-config.mjs) to
 * CloudFront E2ZHTJ5XV3DHIV as a response headers policy on the default
 * behavior. A dry run unless called with --apply and the confirm phrase.
 *
 *   node infra/edge/security-headers.mjs report-only
 *   node infra/edge/security-headers.mjs enforce --apply --confirm "apply chronas.org security headers"
 *   node infra/edge/security-headers.mjs restore <backup.json> --apply --confirm "restore chronas.org distribution"
 *
 * Before any change it saves the distribution config to infra/backups/
 * (gitignored). `restore` puts such a backup back; it leaves the policy in
 * place, unattached. Uses the AWS CLI with the chronas-prod profile
 * (CHRONAS_AWS_PROFILE overrides it) and refuses any account but 937826731833.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { DISTRIBUTION_ID, POLICY_NAME, policyConfig } from './security-headers-config.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = process.env.EDGE_BACKUP_DIR || path.join(HERE, '..', 'backups');
// Not AWS_PROFILE: a shell's default profile may point at another account.
const PROFILE = process.env.CHRONAS_AWS_PROFILE || 'chronas-prod';
const ACCOUNT = '937826731833';
const CONFIRM_APPLY = 'apply chronas.org security headers';
const CONFIRM_RESTORE = 'restore chronas.org distribution';

function aws(args) {
  const out = execFileSync('aws', [...args, '--profile', PROFILE, '--output', 'json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  return out.trim() ? JSON.parse(out) : {};
}

function withTempJson(value, fn) {
  const file = path.join(fs.mkdtempSync(path.join(BACKUP_DIR, 'tmp-')), 'input.json');
  fs.writeFileSync(file, JSON.stringify(value));
  try {
    return fn(`file://${file}`);
  } finally {
    fs.rmSync(path.dirname(file), { recursive: true, force: true });
  }
}

function checkAccount() {
  const { Account } = aws(['sts', 'get-caller-identity']);
  if (Account !== ACCOUNT)
    throw new Error(`profile ${PROFILE} is account ${Account}, not ${ACCOUNT}`);
}

function findPolicy() {
  const list = aws(['cloudfront', 'list-response-headers-policies', '--type', 'custom']);
  const item = (list.ResponseHeadersPolicyList?.Items || []).find(
    (i) => i.ResponseHeadersPolicy.ResponseHeadersPolicyConfig.Name === POLICY_NAME
  );
  return item ? item.ResponseHeadersPolicy.Id : null;
}

function backupDistribution() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const dist = aws(['cloudfront', 'get-distribution-config', '--id', DISTRIBUTION_ID]);
  const file = path.join(
    BACKUP_DIR,
    `${new Date().toISOString().replace(/[:.]/g, '-')}-${DISTRIBUTION_ID}.json`
  );
  fs.writeFileSync(file, JSON.stringify(dist, null, 2));
  return { dist, file };
}

function parseArgs(argv) {
  const [command, arg] = argv;
  const apply = argv.includes('--apply');
  const confirmAt = argv.indexOf('--confirm');
  const confirm = confirmAt >= 0 ? argv[confirmAt + 1] : undefined;
  return { command, arg, apply, confirm };
}

function applyPolicy(mode, { apply, confirm }) {
  const config = policyConfig(mode);
  const policyId = findPolicy();
  const { dist, file } = backupDistribution();
  const behavior = dist.DistributionConfig.DefaultCacheBehavior;

  console.log(`Distribution ${DISTRIBUTION_ID}, backup ${path.relative(process.cwd(), file)}`);
  console.log(`Policy ${POLICY_NAME}: ${policyId ? `update ${policyId}` : 'create'} (CSP ${mode})`);
  console.log(JSON.stringify(config, null, 2));
  console.log(
    `Default behavior response headers policy: ${behavior.ResponseHeadersPolicyId || 'none'}` +
      (policyId && behavior.ResponseHeadersPolicyId === policyId
        ? ' (already attached)'
        : ' -> this policy')
  );

  if (!apply) {
    console.log(`\nDry run. To apply: --apply --confirm "${CONFIRM_APPLY}"`);
    return;
  }
  if (confirm !== CONFIRM_APPLY) throw new Error(`--confirm must be "${CONFIRM_APPLY}"`);

  let id = policyId;
  if (id) {
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
    withTempJson(dist.DistributionConfig, (input) =>
      aws([
        'cloudfront',
        'update-distribution',
        '--id',
        DISTRIBUTION_ID,
        '--if-match',
        dist.ETag,
        '--distribution-config',
        input,
      ])
    );
    console.log(`Attached policy ${id} to the default behavior of ${DISTRIBUTION_ID}`);
  }
  console.log('CloudFront deploys the change to its edge locations within a few minutes.');
}

function restore(backupFile, { apply, confirm }) {
  if (!backupFile) throw new Error('restore needs a backup file');
  const saved = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
  const current = backupDistribution();
  console.log(
    `Restore ${DISTRIBUTION_ID} from ${backupFile} (current config saved to ${current.file})`
  );
  console.log(
    `Response headers policy: ${current.dist.DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId || 'none'} -> ${saved.DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId || 'none'}`
  );
  if (!apply) {
    console.log(`\nDry run. To restore: --apply --confirm "${CONFIRM_RESTORE}"`);
    return;
  }
  if (confirm !== CONFIRM_RESTORE) throw new Error(`--confirm must be "${CONFIRM_RESTORE}"`);
  withTempJson(saved.DistributionConfig, (input) =>
    aws([
      'cloudfront',
      'update-distribution',
      '--id',
      DISTRIBUTION_ID,
      '--if-match',
      current.dist.ETag,
      '--distribution-config',
      input,
    ])
  );
  console.log('Restored.');
}

const args = parseArgs(process.argv.slice(2));
try {
  if (['report-only', 'enforce', 'restore'].includes(args.command)) checkAccount();
  if (args.command === 'report-only' || args.command === 'enforce') applyPolicy(args.command, args);
  else if (args.command === 'restore') restore(args.arg, args);
  else {
    console.error(
      'Usage: security-headers.mjs report-only|enforce|restore <backup.json> [--apply --confirm "<phrase>"]'
    );
    process.exitCode = 2;
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
}
