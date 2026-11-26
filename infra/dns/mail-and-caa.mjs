#!/usr/bin/env node
/**
 * Mail and CAA records for chronas.org (Route 53 zone Z005461139KF8GDMY491N).
 * A dry run unless called with --apply and the confirm phrase.
 *
 *   node infra/dns/mail-and-caa.mjs
 *   node infra/dns/mail-and-caa.mjs --apply --confirm "apply chronas.org mail and CAA records"
 *
 * Added 2026-11 after the pentest (C4: no SPF/DKIM/DMARC, so anyone could send
 * mail as @chronas.org; R15: no CAA). chronas.org has no MX record and sends no
 * mail, so SPF allows no sender and DMARC rejects everything; DKIM needs no
 * record while nothing signs mail. If chronas.org ever sends mail (a provider,
 * a newsletter), add that sender to SPF and its DKIM key first, and relax DMARC.
 *
 * CAA allows Amazon (ACM: the CloudFront certificate for chronas.org and
 * *.chronas.org) and Let's Encrypt (GitHub Pages: spoken-history.chronas.org).
 * A certificate from any other CA, or from these two for a new host, needs
 * its CA added here first, or the CA must refuse to issue it.
 *
 * Records are created with CREATE, so an existing record with the same name
 * and type makes the change fail instead of being overwritten. Before the
 * change the current records of those names are saved to infra/backups/.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = process.env.EDGE_BACKUP_DIR || path.join(HERE, '..', 'backups');
// Not AWS_PROFILE: a shell's default profile may point at another account.
const PROFILE = process.env.CHRONAS_AWS_PROFILE || 'chronas-prod';
const ACCOUNT = '937826731833';
const ZONE_ID = 'Z005461139KF8GDMY491N';
const CONFIRM = 'apply chronas.org mail and CAA records';
const TTL = 3600;

export const RECORDS = [
  { Name: 'chronas.org.', Type: 'TXT', Values: ['"v=spf1 -all"'] },
  {
    Name: '_dmarc.chronas.org.',
    Type: 'TXT',
    Values: ['"v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s"'],
  },
  {
    Name: 'chronas.org.',
    Type: 'CAA',
    Values: ['0 issue "amazon.com"', '0 issue "letsencrypt.org"'],
  },
];

function aws(args) {
  const out = execFileSync('aws', [...args, '--profile', PROFILE, '--output', 'json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  return out.trim() ? JSON.parse(out) : {};
}

const argv = process.argv.slice(2);
const apply = argv.includes('--apply');
const confirm = argv[argv.indexOf('--confirm') + 1];

try {
  const { Account } = aws(['sts', 'get-caller-identity']);
  if (Account !== ACCOUNT)
    throw new Error(`profile ${PROFILE} is account ${Account}, not ${ACCOUNT}`);

  const { ResourceRecordSets } = aws([
    'route53',
    'list-resource-record-sets',
    '--hosted-zone-id',
    ZONE_ID,
  ]);
  const existing = ResourceRecordSets.filter((set) =>
    RECORDS.some((r) => r.Name === set.Name && r.Type === set.Type)
  );
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const backup = path.join(
    BACKUP_DIR,
    `${new Date().toISOString().replace(/[:.]/g, '-')}-${ZONE_ID}-mail-caa.json`
  );
  fs.writeFileSync(backup, JSON.stringify(existing, null, 2));

  for (const r of RECORDS)
    console.log(`CREATE ${r.Type.padEnd(4)} ${r.Name.padEnd(22)} ${r.Values.join(' | ')}`);
  if (existing.length) {
    console.log(
      `\nAlready present (the change would fail): ${existing.map((s) => `${s.Type} ${s.Name}`).join(', ')}`
    );
  }
  if (!apply) {
    console.log(
      `\nDry run (backup ${path.relative(process.cwd(), backup)}). To apply: --apply --confirm "${CONFIRM}"`
    );
  } else {
    if (confirm !== CONFIRM) throw new Error(`--confirm must be "${CONFIRM}"`);
    const batch = {
      Comment: 'chronas.org SPF, DMARC and CAA (chronas-frontend infra/dns)',
      Changes: RECORDS.map((r) => ({
        Action: 'CREATE',
        ResourceRecordSet: {
          Name: r.Name,
          Type: r.Type,
          TTL,
          ResourceRecords: r.Values.map((Value) => ({ Value })),
        },
      })),
    };
    const file = path.join(BACKUP_DIR, 'change-batch.tmp.json');
    fs.writeFileSync(file, JSON.stringify(batch));
    try {
      const { ChangeInfo } = aws([
        'route53',
        'change-resource-record-sets',
        '--hosted-zone-id',
        ZONE_ID,
        '--change-batch',
        `file://${file}`,
      ]);
      console.log(`\nSubmitted ${ChangeInfo.Id} (${ChangeInfo.Status})`);
    } finally {
      fs.rmSync(file, { force: true });
    }
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
}
