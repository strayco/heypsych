#!/usr/bin/env node
/**
 * parse-master-records.cjs
 *
 * Parses the mental-health-clinician-tools-master-1000.md markdown file
 * and extracts all 1,000 records into a structured JSON array.
 *
 * Input:  /Users/jack/heypsych/docs/mental-health-clinician-tools-master-1000.md
 * Output: /Users/jack/heypsych/data/tools-v4/raw/master-records.json
 *         /Users/jack/heypsych/data/tools-v4/raw/parse-report.json
 */

const fs = require('fs');
const path = require('path');

// Paths
const INPUT_FILE = path.join(__dirname, '../../docs/mental-health-clinician-tools-master-1000.md');
const OUTPUT_DIR = path.join(__dirname, '../../data/tools-v4/raw');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'master-records.json');
const REPORT_FILE = path.join(OUTPUT_DIR, 'parse-report.json');

/**
 * Extract URL from markdown link format: [text](url) -> url
 * Returns empty string if no valid link found
 */
function extractUrl(markdownLink) {
  if (!markdownLink || markdownLink.trim() === '') {
    return '';
  }

  const match = markdownLink.match(/\[.*?\]\((.*?)\)/);
  if (match && match[1]) {
    return match[1];
  }

  // If it's already a plain URL, return it
  if (markdownLink.startsWith('http://') || markdownLink.startsWith('https://')) {
    return markdownLink.trim();
  }

  return '';
}

/**
 * Parse a markdown table row into an array of cell values
 * Handles escaped pipes and trims whitespace
 */
function parseTableRow(row) {
  // Remove leading and trailing pipes and split
  const trimmed = row.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) {
    return null;
  }

  // Remove first and last pipe, then split on remaining pipes
  const inner = trimmed.slice(1, -1);
  const cells = inner.split('|').map(cell => cell.trim());

  return cells;
}

/**
 * Parse a single table row into a structured record object
 */
function parseRecord(cells) {
  if (!cells || cells.length < 23) {
    return null;
  }

  return {
    source_row: parseInt(cells[0], 10) || 0,
    record_id: cells[1] || '',
    company_vendor: cells[2] || '',
    product_tool: cells[3] || '',
    record_type: cells[4] || '',
    primary_category: cells[5] || '',
    subcategory: cells[6] || '',
    mental_health_fit: cells[7] || '',
    status: cells[8] || '',
    ai: cells[9] || '',
    ehr_clinical_record: cells[10] || '',
    rcm_billing: cells[11] || '',
    telehealth_comms: cells[12] || '',
    measurement_outcomes: cells[13] || '',
    target_user_setting: cells[14] || '',
    accelerator: cells[15] || '',
    batch: cells[16] || '',
    region: cells[17] || '',
    notes: cells[18] || '',
    evidence_tier: cells[19] || '',
    source_url: extractUrl(cells[20]),
    canonical_key: cells[21] || '',
    same_name_candidate_ids: cells[22] || ''
  };
}

/**
 * Generate summary report
 */
function generateReport(records) {
  const report = {
    total_records: records.length,
    records_by_type: {},
    records_by_category: {},
    records_by_status: {},
    duplicate_canonical_keys: []
  };

  // Count by record type
  for (const record of records) {
    const type = record.record_type || '(empty)';
    report.records_by_type[type] = (report.records_by_type[type] || 0) + 1;
  }

  // Count by primary category
  for (const record of records) {
    const category = record.primary_category || '(empty)';
    report.records_by_category[category] = (report.records_by_category[category] || 0) + 1;
  }

  // Count by status
  for (const record of records) {
    const status = record.status || '(empty)';
    report.records_by_status[status] = (report.records_by_status[status] || 0) + 1;
  }

  // Find duplicate canonical keys
  const keyCount = {};
  for (const record of records) {
    const key = record.canonical_key;
    if (key) {
      if (!keyCount[key]) {
        keyCount[key] = [];
      }
      keyCount[key].push(record.record_id);
    }
  }

  for (const [key, ids] of Object.entries(keyCount)) {
    if (ids.length > 1) {
      report.duplicate_canonical_keys.push({
        canonical_key: key,
        record_ids: ids,
        count: ids.length
      });
    }
  }

  // Sort duplicate keys by canonical_key for consistent output
  report.duplicate_canonical_keys.sort((a, b) => a.canonical_key.localeCompare(b.canonical_key));

  return report;
}

/**
 * Main parsing function
 */
function main() {
  console.log('Reading markdown file...');
  const content = fs.readFileSync(INPUT_FILE, 'utf8');
  const lines = content.split('\n');

  console.log(`Total lines in file: ${lines.length}`);

  // Find the table header line (starts with "| Source row |")
  let headerLineIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('| Source row |') && lines[i].includes('| Record ID |')) {
      headerLineIndex = i;
      break;
    }
  }

  if (headerLineIndex === -1) {
    console.error('ERROR: Could not find table header line');
    process.exit(1);
  }

  console.log(`Found table header at line ${headerLineIndex + 1}`);

  // Parse the header to verify column count
  const headerCells = parseTableRow(lines[headerLineIndex]);
  console.log(`Header has ${headerCells.length} columns`);

  // Skip the separator line (headerLineIndex + 1) and start parsing data rows
  const dataStartIndex = headerLineIndex + 2;
  const records = [];
  const parseErrors = [];

  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines or non-table lines
    if (!line || !line.startsWith('|')) {
      continue;
    }

    // Stop if we hit the end of the table (--- separator or other markdown)
    if (line.startsWith('---') || line.startsWith('#')) {
      break;
    }

    const cells = parseTableRow(line);
    if (!cells) {
      parseErrors.push({ line: i + 1, error: 'Failed to parse table row', content: line.substring(0, 100) });
      continue;
    }

    const record = parseRecord(cells);
    if (!record) {
      parseErrors.push({ line: i + 1, error: 'Failed to create record object', cells: cells.length });
      continue;
    }

    // Validate record has required fields
    if (!record.record_id) {
      parseErrors.push({ line: i + 1, error: 'Missing record_id', content: line.substring(0, 100) });
      continue;
    }

    records.push(record);
  }

  console.log(`\nParsed ${records.length} records`);

  if (parseErrors.length > 0) {
    console.log(`\nParse errors: ${parseErrors.length}`);
    parseErrors.slice(0, 5).forEach(err => console.log(`  Line ${err.line}: ${err.error}`));
  }

  // Validate record count
  if (records.length !== 1000) {
    console.warn(`\nWARNING: Expected 1000 records, but parsed ${records.length}`);

    // Show first and last record IDs for debugging
    if (records.length > 0) {
      console.log(`First record: ${records[0].record_id}`);
      console.log(`Last record: ${records[records.length - 1].record_id}`);
    }
  } else {
    console.log('\nValidation PASSED: Extracted exactly 1000 records');
  }

  // Generate report
  const report = generateReport(records);

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Write records to JSON
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(records, null, 2));
  console.log(`\nWrote records to: ${OUTPUT_FILE}`);

  // Write report to JSON
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  console.log(`Wrote report to: ${REPORT_FILE}`);

  // Print summary
  console.log('\n=== SUMMARY ===');
  console.log(`Total records: ${report.total_records}`);
  console.log(`\nRecords by Type:`);
  Object.entries(report.records_by_type)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => console.log(`  ${type}: ${count}`));

  console.log(`\nRecords by Status:`);
  Object.entries(report.records_by_status)
    .sort((a, b) => b[1] - a[1])
    .forEach(([status, count]) => console.log(`  ${status}: ${count}`));

  console.log(`\nDuplicate Canonical Keys: ${report.duplicate_canonical_keys.length} groups`);
  if (report.duplicate_canonical_keys.length > 0) {
    report.duplicate_canonical_keys.forEach(dup => {
      console.log(`  ${dup.canonical_key}: ${dup.record_ids.join(', ')}`);
    });
  }

  // Exit with error if validation failed
  if (records.length !== 1000) {
    process.exit(1);
  }
}

main();
