/**
 * AWS Deployment Script
 * 
 * Deploys the built frontend to S3 with CloudFront distribution.
 * Features:
 * - Checks AWS credentials before deployment
 * - Creates S3 bucket if it doesn't exist
 * - Creates CloudFront distribution if it doesn't exist
 * - Syncs dist folder to S3
 * - Invalidates CloudFront cache
 * - Outputs the public URL
 * 
 * Usage: npm run deploy -- [environment]
 * Environments: development, staging, production
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface DeployConfig {
  awsProfile: string;
  awsRegion: string;
  s3Bucket: string;
  cloudfrontDistributionId: string;
  environment: string;
}

// Config file to persist CloudFront distribution IDs
const CONFIG_FILE = join(import.meta.dirname, '../.deploy-config.json');

function loadPersistedConfig(): Record<string, { distributionId: string; url: string }> {
  if (existsSync(CONFIG_FILE)) {
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')) as Record<string, { distributionId: string; url: string }>;
  }
  return {};
}

function savePersistedConfig(config: Record<string, { distributionId: string; url: string }>): void {
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

const deployConfigs: Record<string, DeployConfig> = {
  development: {
    awsProfile: 'chronas-dev',
    awsRegion: 'eu-west-1',
    s3Bucket: 'chronas-frontend-dev',
    cloudfrontDistributionId: '', // Will be auto-detected or created
    environment: 'development',
  },
  staging: {
    awsProfile: 'chronas-dev',
    awsRegion: 'eu-west-1',
    s3Bucket: 'chronas-frontend-staging',
    cloudfrontDistributionId: '',
    environment: 'staging',
  },
  production: {
    awsProfile: 'chronas-dev',
    awsRegion: 'eu-west-1',
    s3Bucket: 'chronas-frontend-prod',
    cloudfrontDistributionId: '',
    environment: 'production',
  },
};

function run(command: string, silent = false): string {
  if (!silent) console.log(`> ${command}`);
  return execSync(command, { 
    encoding: 'utf-8',
    stdio: silent ? 'pipe' : 'inherit',
    maxBuffer: 10 * 1024 * 1024,
  });
}

function runJson(command: string): unknown {
  try {
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe', maxBuffer: 10 * 1024 * 1024 });
    return JSON.parse(output) as unknown;
  } catch {
    return null;
  }
}

function runSafe(command: string): { success: boolean; output: string } {
  try {
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    return { success: true, output };
  } catch {
    return { success: false, output: '' };
  }
}

function checkAwsCredentials(profile: string): boolean {
  console.log('🔐 Checking AWS credentials...');
  const result = runSafe(`aws sts get-caller-identity --profile ${profile}`);
  if (!result.success) {
    console.error(`\n❌ AWS credentials not configured for profile: ${profile}`);
    console.error('\nTo fix this, run one of the following:');
    console.error(`  1. aws configure --profile ${profile}`);
    console.error('  2. mwinit (if using Midway)');
    console.error(`  3. aws sso login --profile ${profile} (if using SSO)`);
    return false;
  }
  console.log('✅ AWS credentials valid\n');
  return true;
}

function bucketExists(bucket: string, profile: string, region: string): boolean {
  const result = runSafe(
    `aws s3api head-bucket --bucket ${bucket} --profile ${profile} --region ${region}`
  );
  return result.success;
}

function createBucket(bucket: string, profile: string, region: string): void {
  console.log(`📦 Creating S3 bucket: ${bucket}...`);
  
  if (region === 'us-east-1') {
    run(`aws s3api create-bucket --bucket ${bucket} --profile ${profile} --region ${region}`);
  } else {
    run(
      `aws s3api create-bucket --bucket ${bucket} --profile ${profile} --region ${region} ` +
      `--create-bucket-configuration LocationConstraint=${region}`
    );
  }

  // Enable versioning
  console.log('📚 Enabling versioning...');
  run(
    `aws s3api put-bucket-versioning --bucket ${bucket} --profile ${profile} ` +
    `--versioning-configuration Status=Enabled`,
    true
  );

  console.log(`✅ Bucket ${bucket} created\n`);
}

function findExistingDistribution(bucket: string, profile: string): string | null {
  console.log('🔍 Looking for existing CloudFront distribution...');
  
  interface DistributionSummary {
    Id: string;
    Origins: { Items: { DomainName: string }[] };
    Comment: string;
  }
  
  interface DistributionListResponse {
    DistributionList?: { Items?: DistributionSummary[] };
  }
  
  const result = runJson(
    `aws cloudfront list-distributions --profile ${profile}`
  ) as DistributionListResponse | null;
  
  if (!result?.DistributionList?.Items) return null;
  
  for (const dist of result.DistributionList.Items) {
    const origins = dist.Origins.Items;
    for (const origin of origins) {
      if (origin.DomainName.includes(bucket)) {
        console.log(`✅ Found existing distribution: ${dist.Id}\n`);
        return dist.Id;
      }
    }
  }
  
  return null;
}

function createCloudFrontDistribution(bucket: string, profile: string, region: string, env: string): { id: string; url: string } {
  console.log('☁️ Creating CloudFront distribution...');
  
  // Create Origin Access Control
  const oacName = `${bucket}-oac`;
  let oacId: string;
  
  // Check if OAC exists
  interface OacListResponse {
    OriginAccessControlList?: { Items?: { Id: string; Name: string }[] };
  }
  
  const oacList = runJson(
    `aws cloudfront list-origin-access-controls --profile ${profile}`
  ) as OacListResponse | null;
  
  const existingOac = oacList?.OriginAccessControlList?.Items?.find(o => o.Name === oacName);
  
  if (existingOac) {
    oacId = existingOac.Id;
    console.log(`   Using existing OAC: ${oacId}`);
  } else {
    const oacConfig = {
      Name: oacName,
      Description: `OAC for ${bucket}`,
      SigningProtocol: 'sigv4',
      SigningBehavior: 'always',
      OriginAccessControlOriginType: 's3',
    };
    
    interface OacCreateResponse {
      OriginAccessControl?: { Id: string };
    }
    
    const oacResult = runJson(
      `aws cloudfront create-origin-access-control --origin-access-control-config '${JSON.stringify(oacConfig)}' --profile ${profile}`
    ) as OacCreateResponse | null;
    
    if (!oacResult?.OriginAccessControl) throw new Error('Failed to create OAC');
    oacId = oacResult.OriginAccessControl.Id;
    console.log(`   Created OAC: ${oacId}`);
  }
  
  // Create CloudFront distribution config
  const distConfig = {
    CallerReference: `${bucket}-${String(Date.now())}`,
    Comment: `Chronas Frontend ${env.toUpperCase()}`,
    DefaultRootObject: 'index.html',
    Origins: {
      Quantity: 1,
      Items: [{
        Id: `S3-${bucket}`,
        DomainName: `${bucket}.s3.${region}.amazonaws.com`,
        S3OriginConfig: { OriginAccessIdentity: '' },
        OriginAccessControlId: oacId,
      }],
    },
    DefaultCacheBehavior: {
      TargetOriginId: `S3-${bucket}`,
      ViewerProtocolPolicy: 'redirect-to-https',
      AllowedMethods: {
        Quantity: 2,
        Items: ['GET', 'HEAD'],
        CachedMethods: { Quantity: 2, Items: ['GET', 'HEAD'] },
      },
      CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6', // CachingOptimized
      Compress: true,
    },
    CustomErrorResponses: {
      Quantity: 2,
      Items: [
        { ErrorCode: 404, ResponsePagePath: '/index.html', ResponseCode: '200', ErrorCachingMinTTL: 0 },
        { ErrorCode: 403, ResponsePagePath: '/index.html', ResponseCode: '200', ErrorCachingMinTTL: 0 },
      ],
    },
    Enabled: true,
    PriceClass: 'PriceClass_100',
    HttpVersion: 'http2',
    IsIPV6Enabled: true,
  };
  
  interface DistCreateResponse {
    Distribution?: { Id: string; DomainName: string };
  }
  
  const distResult = runJson(
    `aws cloudfront create-distribution --distribution-config '${JSON.stringify(distConfig)}' --profile ${profile}`
  ) as DistCreateResponse | null;
  
  if (!distResult?.Distribution) throw new Error('Failed to create CloudFront distribution');
  
  const distId = distResult.Distribution.Id;
  const distUrl = `https://${distResult.Distribution.DomainName}`;
  
  console.log(`✅ Created CloudFront distribution: ${distId}`);
  console.log(`   URL: ${distUrl}\n`);
  
  // Update S3 bucket policy to allow CloudFront access
  console.log('🔒 Updating S3 bucket policy for CloudFront...');
  
  interface CallerIdentityResponse {
    Account?: string;
  }
  
  const callerIdentity = runJson(
    `aws sts get-caller-identity --profile ${profile}`
  ) as CallerIdentityResponse | null;
  
  const accountId = callerIdentity?.Account;
  
  if (!accountId) throw new Error('Failed to get AWS account ID');
  
  const bucketPolicy = {
    Version: '2012-10-17',
    Statement: [{
      Sid: 'AllowCloudFrontServicePrincipal',
      Effect: 'Allow',
      Principal: { Service: 'cloudfront.amazonaws.com' },
      Action: 's3:GetObject',
      Resource: `arn:aws:s3:::${bucket}/*`,
      Condition: {
        StringEquals: {
          'AWS:SourceArn': `arn:aws:cloudfront::${accountId}:distribution/${distId}`,
        },
      },
    }],
  };
  
  run(
    `aws s3api put-bucket-policy --bucket ${bucket} --policy '${JSON.stringify(bucketPolicy)}' --profile ${profile}`,
    true
  );
  
  // Block public access (CloudFront will access via OAC)
  run(
    `aws s3api put-public-access-block --bucket ${bucket} --profile ${profile} ` +
    `--public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false"`,
    true
  );
  
  return { id: distId, url: distUrl };
}

function getDistributionUrl(distId: string, profile: string): string {
  interface DistGetResponse {
    Distribution?: { DomainName: string };
  }
  
  const result = runJson(
    `aws cloudfront get-distribution --id ${distId} --profile ${profile}`
  ) as DistGetResponse | null;
  
  return result?.Distribution ? `https://${result.Distribution.DomainName}` : '';
}

function deploy(environment: string): void {
  const config = deployConfigs[environment];
  
  if (!config) {
    console.error(`❌ Unknown environment: ${environment}`);
    console.error(`Available: ${Object.keys(deployConfigs).join(', ')}`);
    process.exit(1);
  }

  console.log(`\n🚀 Deploying to ${environment}...\n`);
  console.log(`   Profile: ${config.awsProfile}`);
  console.log(`   Region:  ${config.awsRegion}`);
  console.log(`   Bucket:  ${config.s3Bucket}\n`);

  // Step 1: Check AWS credentials
  if (!checkAwsCredentials(config.awsProfile)) {
    process.exit(1);
  }

  // Step 2: Check/create bucket
  console.log('🪣 Checking S3 bucket...');
  if (!bucketExists(config.s3Bucket, config.awsProfile, config.awsRegion)) {
    console.log(`   Bucket ${config.s3Bucket} does not exist`);
    createBucket(config.s3Bucket, config.awsProfile, config.awsRegion);
  } else {
    console.log(`✅ Bucket ${config.s3Bucket} exists\n`);
  }

  // Step 3: Check/create CloudFront distribution
  const persistedConfig = loadPersistedConfig();
  let distributionId = persistedConfig[environment]?.distributionId ?? '';
  let distributionUrl = persistedConfig[environment]?.url ?? '';
  
  if (!distributionId) {
    distributionId = findExistingDistribution(config.s3Bucket, config.awsProfile) ?? '';
  }
  
  if (!distributionId) {
    const cfResult = createCloudFrontDistribution(
      config.s3Bucket, 
      config.awsProfile, 
      config.awsRegion, 
      environment
    );
    distributionId = cfResult.id;
    distributionUrl = cfResult.url;
    
    // Persist the config
    persistedConfig[environment] = { distributionId, url: distributionUrl };
    savePersistedConfig(persistedConfig);
  } else {
    console.log(`✅ Using CloudFront distribution: ${distributionId}\n`);
    if (!distributionUrl) {
      distributionUrl = getDistributionUrl(distributionId, config.awsProfile);
      persistedConfig[environment] = { distributionId, url: distributionUrl };
      savePersistedConfig(persistedConfig);
    }
  }

  // Step 4: Build the application
  console.log('📦 Building application...');
  run('npm run build');

  // Step 5: Upload to S3 with correct content types and cache headers
  console.log('\n☁️ Uploading to S3...');
  
  // First sync everything except JS files and index.html
  run(
    `aws s3 sync dist/ s3://${config.s3Bucket}/ --delete ` +
    `--exclude "*.js" --exclude "*.js.map" --exclude "index.html" ` +
    `--cache-control "public, max-age=31536000, immutable" ` +
    `--profile ${config.awsProfile} --region ${config.awsRegion}`
  );
  
  // Upload JS files with correct content type and cache headers
  console.log('   Uploading JavaScript files...');
  run(
    `aws s3 cp dist/assets/ s3://${config.s3Bucket}/assets/ ` +
    `--recursive --exclude "*" --include "*.js" ` +
    `--content-type "application/javascript" ` +
    `--cache-control "public, max-age=31536000, immutable" ` +
    `--metadata-directive REPLACE ` +
    `--profile ${config.awsProfile} --region ${config.awsRegion}`
  );
  
  // Upload JS map files with correct content type
  console.log('   Uploading source maps...');
  run(
    `aws s3 cp dist/assets/ s3://${config.s3Bucket}/assets/ ` +
    `--recursive --exclude "*" --include "*.js.map" ` +
    `--content-type "application/json" ` +
    `--cache-control "public, max-age=31536000, immutable" ` +
    `--metadata-directive REPLACE ` +
    `--profile ${config.awsProfile} --region ${config.awsRegion}`
  );
  
  // Upload index.html with no-cache
  console.log('   Uploading index.html...');
  run(
    `aws s3 cp dist/index.html s3://${config.s3Bucket}/index.html ` +
    `--content-type "text/html" ` +
    `--cache-control "public, max-age=0, must-revalidate" ` +
    `--metadata-directive REPLACE ` +
    `--profile ${config.awsProfile} --region ${config.awsRegion}`
  );

  // Step 6: Invalidate CloudFront cache
  console.log('\n🔄 Invalidating CloudFront cache...');
  run(
    `aws cloudfront create-invalidation ` +
    `--distribution-id ${distributionId} ` +
    `--paths "/*" --profile ${config.awsProfile}`,
    true
  );

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Deployment to ${environment} complete!`);
  console.log('='.repeat(60));
  console.log(`\n   🌐 URL: ${distributionUrl}`);
  console.log(`   📦 Bucket: s3://${config.s3Bucket}/`);
  console.log(`   ☁️  Distribution: ${distributionId}`);
  console.log(`\n   Note: New distributions may take 5-10 minutes to fully deploy.`);
  console.log(`   Run 'npm run test:deploy' to verify the deployment.\n`);
}

// Get environment from command line args
const environment = process.argv[2] ?? 'development';

try {
  deploy(environment);
} catch (error) {
  console.error('\n❌ Deployment failed:', error instanceof Error ? error.message : error);
  process.exit(1);
}
