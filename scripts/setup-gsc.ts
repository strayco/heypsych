#!/usr/bin/env npx tsx
/**
 * Google Search Console Setup Script
 *
 * This script helps configure GSC API access for HeyPsych.
 *
 * Usage:
 *   npx tsx scripts/setup-gsc.ts --json /path/to/service-account.json
 *   npx tsx scripts/setup-gsc.ts --test
 *
 * Prerequisites:
 *   1. Create a GCP project at https://console.cloud.google.com
 *   2. Enable "Search Console API"
 *   3. Create a service account and download JSON key
 *   4. Add service account email to GSC as a user
 */

import fs from "fs";
import path from "path";

const SITE_URL = "https://heypsych.com";

interface ServiceAccountKey {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

async function testConnection(): Promise<void> {
  const clientEmail = process.env.GSC_CLIENT_EMAIL;
  const privateKey = process.env.GSC_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    console.log("❌ GSC credentials not configured");
    console.log("\nTo configure, either:");
    console.log("  1. Run: npx tsx scripts/setup-gsc.ts --json /path/to/key.json");
    console.log("  2. Set GSC_CLIENT_EMAIL and GSC_PRIVATE_KEY in .env.local");
    return;
  }

  console.log(`✓ GSC_CLIENT_EMAIL: ${clientEmail}`);
  console.log(`✓ GSC_PRIVATE_KEY: [configured]`);
  console.log(`\nAttempting to connect to GSC API for ${SITE_URL}...`);

  // Try to import and test
  try {
    const { importFromGSCApi } = await import("../src/lib/seo/search-performance");
    const result = await importFromGSCApi({
      siteUrl: SITE_URL,
      clientEmail,
      privateKey,
    });

    if (result.success) {
      console.log(`\n✅ Connection successful!`);
      console.log(`   Rows imported: ${result.rowsImported}`);
      console.log(`   Date range: ${result.dateRange.startDate} to ${result.dateRange.endDate}`);
    } else {
      console.log(`\n❌ Connection failed`);
      if (result.errors) {
        result.errors.forEach((err: string) => console.log(`   ${err}`));
      }
    }
  } catch (error) {
    console.log(`\n❌ Error: ${error}`);
  }
}

async function importFromJson(jsonPath: string): Promise<void> {
  const absolutePath = path.resolve(jsonPath);

  if (!fs.existsSync(absolutePath)) {
    console.log(`❌ File not found: ${absolutePath}`);
    return;
  }

  try {
    const content = fs.readFileSync(absolutePath, "utf-8");
    const key: ServiceAccountKey = JSON.parse(content);

    if (!key.client_email || !key.private_key) {
      console.log("❌ Invalid service account JSON (missing client_email or private_key)");
      return;
    }

    console.log(`✓ Found service account: ${key.client_email}`);
    console.log(`✓ Project: ${key.project_id}`);

    // Check if .env.local exists
    const envPath = path.join(process.cwd(), ".env.local");
    let envContent = "";

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf-8");

      // Check if GSC vars already exist
      if (envContent.includes("GSC_CLIENT_EMAIL=")) {
        console.log("\n⚠️  GSC credentials already exist in .env.local");
        console.log("   Remove existing GSC_CLIENT_EMAIL and GSC_PRIVATE_KEY to replace.");
        return;
      }
    }

    // Escape the private key for .env format
    const escapedKey = key.private_key.replace(/\n/g, "\\n");

    // Append GSC config
    const gscConfig = `
# Google Search Console API (added by setup-gsc.ts)
GSC_CLIENT_EMAIL=${key.client_email}
GSC_PRIVATE_KEY="${escapedKey}"
`;

    fs.appendFileSync(envPath, gscConfig);

    console.log(`\n✅ Added GSC credentials to .env.local`);
    console.log(`\n⚠️  IMPORTANT: Add the service account to Search Console:`);
    console.log(`   1. Go to https://search.google.com/search-console`);
    console.log(`   2. Select ${SITE_URL}`);
    console.log(`   3. Settings → Users and permissions → Add user`);
    console.log(`   4. Add: ${key.client_email}`);
    console.log(`   5. Permission: Full`);
    console.log(`\nThen test with: npx tsx scripts/setup-gsc.ts --test`);

  } catch (error) {
    console.log(`❌ Error parsing JSON: ${error}`);
  }
}

async function showHelp(): Promise<void> {
  console.log(`
Google Search Console Setup
============================

This script configures GSC API access for automated data import.

Usage:
  npx tsx scripts/setup-gsc.ts --json /path/to/service-account.json
  npx tsx scripts/setup-gsc.ts --test

Options:
  --json FILE   Import credentials from service account JSON file
  --test        Test the current GSC configuration
  --help        Show this help message

Setup Steps:
  1. Go to https://console.cloud.google.com
  2. Create or select a project
  3. Enable "Search Console API" (APIs & Services → Library)
  4. Create a service account (IAM & Admin → Service Accounts)
  5. Create and download a JSON key
  6. Run: npx tsx scripts/setup-gsc.ts --json /path/to/downloaded-key.json
  7. Add the service account email to Search Console as a user
  8. Test: npx tsx scripts/setup-gsc.ts --test
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.length === 0) {
    await showHelp();
    return;
  }

  if (args.includes("--test")) {
    await testConnection();
    return;
  }

  const jsonIndex = args.indexOf("--json");
  if (jsonIndex !== -1 && args[jsonIndex + 1]) {
    await importFromJson(args[jsonIndex + 1]);
    return;
  }

  await showHelp();
}

main().catch(console.error);
