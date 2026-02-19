#!/usr/bin/env python3
"""
Mass Update Conditions - Batch transform condition JSON files
Adds SEO/AEO/UX enhancements while preserving all clinical data
"""

import json
import os
import sys
import argparse
import hashlib
import time
import shutil
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import OrderedDict
import anthropic
import re

# Converter prompt template
CONVERTER_PROMPT = """You are a psychiatric medical content generation system.
You convert the provided clinical condition JSON into a public-facing educational reference article.
Return ONLY valid JSON, 2-space indentation, UTF-8. No markdown. No commentary.
Preserve all existing keys and their order. Do not delete any clinical data.
Do not invent statistics or citations. Do not infer identifiers. Do not include medication dosing or lab schedules.

Add or ensure these content sections exist (without losing existing data):
- content.aeo.what_is (≤25 words)
- content.description.overview (if not present, use existing description as base)
- content.description.what_it_can_look_like_in_real_life (4–8 mini-stories; 2–4 sentences each; concrete; no diagnostic language; role/age-appropriate for the condition; NO required demographics like "college student")
- content.description.common_reactions_to_diagnosis (realistic reactions when people learn they have this)
- content.lived_experience.first_person_statements (3–6 "I" statements in first person; no diagnostic language; authentic voice)
- content.temporal_criteria (plain-language time course; use explicit durations ONLY if present in input; otherwise qualitative like "weeks to months" or "persistent pattern"; no invented numbers)
- content.misdiagnosis_explained (mechanistic explanation: what it's confused with, why the confusion happens, what clarifies the distinction, timeline/sleep/impairment differences, why one-time symptoms aren't enough for diagnosis)
- content.real_life_examples (3–5 full stories; role/age appropriate for condition; NO required "college student"; include: baseline personality → first internal change → behaviors → consequences → emotional aftermath; leave unresolved, no treatment mentioned)
- content.comparisons (2–4 plain-language comparisons; explain differences without diagnostic labels)
- content.faqs (10–20 questions; include 3–6 "X vs Y" comparison questions)

Add ui.layout="3x3" and ui.tiles[] with these 9 tiles (in order):
1. what-this-is → refs: content.aeo.what_is, content.description.overview
2. what-it-feels-like → refs: content.lived_experience.first_person_statements, content.description.what_it_can_look_like_in_real_life
3. real-life-stories → refs: content.real_life_examples
4. signs-and-symptoms → refs: content.symptoms (+ content.severity_levels if present)
5. early-warning-signs → refs: content.self_help_strategies.warning_signs OR content.warning_signs
6. why-it-happens → refs: content.causes_and_risk_factors OR content.risk_factors + content.neurobiology
7. how-its-told-apart → refs: content.temporal_criteria, content.misdiagnosis_explained, content.evaluation
8. x-vs-other-conditions → refs: content.comparisons, content.differential_diagnosis
9. treatment-and-next-steps → refs: content.treatment_approaches, content.prognosis, content.when_to_seek_help, content.faqs

Each tile includes: id, title, teaser (1-2 sentences), content_refs (array of paths), nav{prev,next}, deep_link "#tile={id}".
Only tile 2 (what-it-feels-like) has default_open: true. Others have default_open: false.

IMPORTANT RULES:
- Differential diagnosis labels (e.g., "Major Depressive Disorder", "GAD") may appear ONLY inside content.differential_diagnosis[]; elsewhere explain differences without labels (use duration, intensity, impairment, loss of control, sleep patterns, baseline vs change).
- Medication monitoring schedules/levels (e.g., "check lithium every 3 months", "CBC every 6 weeks") must be removed and rewritten as general safety concepts under content.treatment_approaches.medication_safety_considerations without numeric schedules.
- Stories in real_life_examples and what_it_can_look_like_in_real_life must NOT require specific demographics. Use age/role-appropriate examples for the condition.
- Do NOT add dosing information, medication schedules, or lab monitoring schedules.

Input JSON to transform:

"""


class ConditionBatchUpdater:
    def __init__(
        self,
        input_dir: str,
        output_dir: Optional[str] = None,
        pattern: str = "*.json",
        concurrency: int = 6,
        dry_run: bool = False,
        api_key: Optional[str] = None
    ):
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir) if output_dir else self.input_dir
        self.pattern = pattern
        self.concurrency = concurrency
        self.dry_run = dry_run

        # Initialize Anthropic client
        self.client = anthropic.Anthropic(
            api_key=api_key or os.environ.get("ANTHROPIC_API_KEY")
        )

        # Logging
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.log_file = self.input_dir / f"_mass_update_log_{timestamp}.txt"
        self.failed_file = self.input_dir / f"_failed_items_{timestamp}.jsonl"
        self.backup_dir = self.input_dir / f"_backup_{timestamp}"

        # Stats
        self.stats = {
            "total": 0,
            "processed": 0,
            "skipped": 0,
            "failed": 0,
            "errors": []
        }

        # Cache for unchanged files
        self.cache_file = self.input_dir / "_cache.json"
        self.cache = self._load_cache()

    def _load_cache(self) -> Dict:
        """Load processing cache to skip unchanged files"""
        if self.cache_file.exists():
            try:
                with open(self.cache_file, 'r') as f:
                    return json.load(f)
            except Exception:
                pass
        return {}

    def _save_cache(self):
        """Save processing cache"""
        try:
            with open(self.cache_file, 'w') as f:
                json.dump(self.cache, f, indent=2)
        except Exception as e:
            self.log(f"Warning: Could not save cache: {e}")

    def _hash_file(self, file_path: Path) -> str:
        """Generate hash of file content"""
        with open(file_path, 'rb') as f:
            return hashlib.sha256(f.read()).hexdigest()

    def log(self, message: str, level: str = "INFO"):
        """Write to log file and console"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_message = f"[{timestamp}] {level}: {message}"
        print(log_message)

        with open(self.log_file, 'a', encoding='utf-8') as f:
            f.write(log_message + "\n")

    def _create_backup(self):
        """Create backup directory with original files"""
        if self.dry_run:
            self.log("DRY RUN: Would create backup at " + str(self.backup_dir))
            return

        self.backup_dir.mkdir(exist_ok=True)
        self.log(f"Created backup directory: {self.backup_dir}")

    def _preserve_key_order(self, original: Dict, updated: Dict) -> OrderedDict:
        """
        Recursively preserve the original key order, appending new keys at the end.
        """
        result = OrderedDict()

        # First, add all original keys in their original order
        for key in original.keys():
            if key in updated:
                # If value is dict, recurse
                if isinstance(original[key], dict) and isinstance(updated[key], dict):
                    result[key] = self._preserve_key_order(original[key], updated[key])
                else:
                    result[key] = updated[key]
            else:
                # Key was in original but not in update - preserve original value
                result[key] = original[key]

        # Then add any new keys from updated
        for key in updated.keys():
            if key not in original:
                result[key] = updated[key]

        return result

    def _validate_json(self, json_str: str) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """Validate JSON string and return parsed dict"""
        try:
            # Use object_pairs_hook to preserve order
            data = json.loads(json_str, object_pairs_hook=OrderedDict)
            return True, data, None
        except json.JSONDecodeError as e:
            return False, None, str(e)

    def _fix_json_response(self, text: str) -> str:
        """Extract JSON from response, handling markdown code blocks"""
        # Remove markdown code blocks if present
        text = text.strip()
        if text.startswith("```"):
            # Find first { and last }
            start = text.find('{')
            end = text.rfind('}')
            if start != -1 and end != -1:
                text = text[start:end+1]
        return text

    def _call_api_with_retry(
        self,
        prompt: str,
        max_retries: int = 3
    ) -> Optional[Dict]:
        """Call Claude API with retry logic"""
        for attempt in range(max_retries):
            try:
                response = self.client.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=16000,
                    temperature=0.3,
                    messages=[
                        {"role": "user", "content": prompt}
                    ]
                )

                # Extract text content
                content = response.content[0].text

                # Fix JSON if needed
                json_str = self._fix_json_response(content)

                # Validate
                valid, data, error = self._validate_json(json_str)

                if valid:
                    return data
                else:
                    self.log(f"JSON validation failed (attempt {attempt + 1}): {error}", "WARNING")

                    # On last attempt, try to fix JSON
                    if attempt == max_retries - 1:
                        fix_prompt = f"The following JSON has an error. Return ONLY the corrected JSON, nothing else:\n\n{json_str}\n\nError: {error}"
                        fix_response = self.client.messages.create(
                            model="claude-sonnet-4-20250514",
                            max_tokens=16000,
                            temperature=0,
                            messages=[{"role": "user", "content": fix_prompt}]
                        )
                        fixed_json = self._fix_json_response(fix_response.content[0].text)
                        valid, data, _ = self._validate_json(fixed_json)
                        if valid:
                            return data

            except anthropic.RateLimitError:
                wait_time = (attempt + 1) * 10
                self.log(f"Rate limit hit, waiting {wait_time}s...", "WARNING")
                time.sleep(wait_time)
            except Exception as e:
                self.log(f"API error (attempt {attempt + 1}): {e}", "ERROR")
                if attempt < max_retries - 1:
                    time.sleep(2)

        return None

    def _transform_file(self, file_path: Path) -> Tuple[bool, Optional[str]]:
        """Transform a single JSON file"""
        try:
            # Read original file with order preservation
            with open(file_path, 'r', encoding='utf-8') as f:
                original_data = json.load(f, object_pairs_hook=OrderedDict)

            # Create backup
            if not self.dry_run:
                backup_path = self.backup_dir / file_path.name
                shutil.copy2(file_path, backup_path)

            # Build prompt
            original_json = json.dumps(original_data, indent=2, ensure_ascii=False)
            full_prompt = CONVERTER_PROMPT + original_json

            # Call API
            self.log(f"Transforming {file_path.name}...")
            transformed_data = self._call_api_with_retry(full_prompt)

            if not transformed_data:
                return False, "API call failed after retries"

            # Preserve original key order
            final_data = self._preserve_key_order(original_data, transformed_data)

            # Write output
            output_path = self.output_dir / file_path.name

            if self.dry_run:
                self.log(f"DRY RUN: Would write to {output_path}")
                # Show sample of changes
                self.log(f"  - Original keys: {len(original_data.get('content', {}))}")
                self.log(f"  - New keys would include: ui, content.aeo, content.temporal_criteria")
            else:
                with open(output_path, 'w', encoding='utf-8') as f:
                    json.dump(final_data, f, indent=2, ensure_ascii=False)
                    f.write('\n')  # Add trailing newline

                # Update cache
                self.cache[str(file_path)] = self._hash_file(output_path)

            return True, None

        except Exception as e:
            error_msg = f"Error processing {file_path.name}: {str(e)}"
            self.log(error_msg, "ERROR")
            return False, error_msg

    def _process_file_wrapper(self, file_path: Path) -> Dict:
        """Wrapper for parallel processing"""
        success, error = self._transform_file(file_path)
        return {
            "file": file_path.name,
            "success": success,
            "error": error
        }

    def process_all(self):
        """Process all matching files"""
        # Find all JSON files
        files = list(self.input_dir.glob(self.pattern))
        # Filter out special files
        files = [
            f for f in files
            if not f.name.startswith('_') and not f.name.startswith('.')
        ]

        self.stats["total"] = len(files)
        self.log(f"Found {len(files)} files to process")

        if not files:
            self.log("No files found matching pattern", "WARNING")
            return

        # Create backup
        self._create_backup()

        # Process files in parallel
        with ThreadPoolExecutor(max_workers=self.concurrency) as executor:
            futures = {
                executor.submit(self._process_file_wrapper, f): f
                for f in files
            }

            for future in as_completed(futures):
                result = future.result()

                if result["success"]:
                    self.stats["processed"] += 1
                    self.log(f"✓ {result['file']} processed successfully")
                else:
                    self.stats["failed"] += 1
                    self.stats["errors"].append({
                        "file": result["file"],
                        "error": result["error"]
                    })

                    # Write to failed file
                    with open(self.failed_file, 'a', encoding='utf-8') as f:
                        f.write(json.dumps(result) + "\n")

        # Save cache
        if not self.dry_run:
            self._save_cache()

        # Print summary
        self._print_summary()

    def _print_summary(self):
        """Print processing summary"""
        self.log("\n" + "="*60)
        self.log("PROCESSING SUMMARY")
        self.log("="*60)
        self.log(f"Total files:      {self.stats['total']}")
        self.log(f"Processed:        {self.stats['processed']}")
        self.log(f"Failed:           {self.stats['failed']}")
        self.log(f"Success rate:     {self.stats['processed']/max(self.stats['total'],1)*100:.1f}%")

        if self.stats["errors"]:
            self.log("\nFailed files:")
            for err in self.stats["errors"]:
                self.log(f"  - {err['file']}: {err['error']}")

        self.log(f"\nLog file: {self.log_file}")
        if self.stats["failed"] > 0:
            self.log(f"Failed items: {self.failed_file}")
        if not self.dry_run:
            self.log(f"Backup: {self.backup_dir}")


def main():
    parser = argparse.ArgumentParser(
        description="Mass update condition JSON files with SEO/AEO/UX enhancements"
    )
    parser.add_argument(
        "--dir",
        default="/Users/jack/heypsych/data/conditions",
        help="Input directory containing JSON files"
    )
    parser.add_argument(
        "--out",
        help="Output directory (default: overwrite in place)"
    )
    parser.add_argument(
        "--pattern",
        default="*.json",
        help="File pattern to match (default: *.json)"
    )
    parser.add_argument(
        "--concurrency",
        type=int,
        default=6,
        help="Number of parallel workers (default: 6)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Run without making changes"
    )
    parser.add_argument(
        "--api-key",
        help="Anthropic API key (or use ANTHROPIC_API_KEY env var)"
    )

    args = parser.parse_args()

    # Validate API key
    api_key = args.api_key or os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY environment variable or --api-key argument required")
        sys.exit(1)

    # Create updater and run
    updater = ConditionBatchUpdater(
        input_dir=args.dir,
        output_dir=args.out,
        pattern=args.pattern,
        concurrency=args.concurrency,
        dry_run=args.dry_run,
        api_key=api_key
    )

    updater.process_all()


if __name__ == "__main__":
    main()
