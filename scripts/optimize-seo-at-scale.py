#!/usr/bin/env python3
"""
SEO Optimization Script - Fixes ALL pages with CTR-optimized titles and descriptions.

CTR Optimization Principles:
1. Add year (2026) for freshness
2. Include pricing when available
3. Add social proof (ratings, user counts, market position)
4. Add curiosity hooks ("Pros & Cons", "Is it worth it?", "See if...")
5. Keep titles under 60 chars (Google truncates at ~60)
6. Keep descriptions 120-160 chars (sweet spot)
7. Match search intent
"""

import json
import os
import re
from pathlib import Path
from datetime import datetime

YEAR = "2026"
UPDATED_COUNT = 0
SKIPPED_COUNT = 0

def truncate(text: str, max_len: int) -> str:
    """Truncate text to max length, ending at word boundary."""
    if len(text) <= max_len:
        return text
    truncated = text[:max_len-3].rsplit(' ', 1)[0]
    return truncated + "..."

def extract_price(pricing: dict):
    """Extract displayable price from pricing object."""
    if not pricing:
        return None

    # Try various price fields
    if pricing.get('starting_price_display'):
        return pricing['starting_price_display']
    if pricing.get('starting_price'):
        return pricing['starting_price']
    if pricing.get('tiers') and len(pricing['tiers']) > 0:
        first_tier = pricing['tiers'][0]
        if first_tier.get('price'):
            return first_tier['price']
    return None

def has_good_seo(seo: dict, name: str) -> bool:
    """Check if SEO already looks optimized (has year, pricing signals, etc.)."""
    if not seo:
        return False
    title = seo.get('title', '')
    desc = seo.get('meta_description', '')

    # Check for optimization signals
    has_year = YEAR in title or '2025' in title
    has_review = 'review' in title.lower()
    has_pricing = '$' in title or 'pricing' in title.lower()
    has_hook = any(h in title.lower() for h in ['pros', 'cons', 'vs', 'best', 'top'])

    # If title is just "Name | HeyPsych" it's not optimized
    if title.strip().lower() in [f"{name.lower()} | heypsych", name.lower()]:
        return False

    # Consider optimized if has at least 2 signals
    signals = sum([has_year, has_review, has_pricing, has_hook])
    return signals >= 2

# ============================================================================
# V4 CLINICIAN TOOLS
# ============================================================================

def optimize_clinician_tool(filepath: Path) -> bool:
    """Optimize a V4 clinician tool's SEO."""
    global UPDATED_COUNT, SKIPPED_COUNT

    with open(filepath, 'r') as f:
        data = json.load(f)

    name = data.get('name', '')
    if not name:
        return False

    # Skip if already optimized
    if has_good_seo(data.get('seo'), name):
        SKIPPED_COUNT += 1
        return False

    # Extract useful info
    pricing = data.get('pricing', {})
    price_str = extract_price(pricing)
    category = data.get('primary_category', '').replace('-', ' ').title()
    one_liner = data.get('one_liner', '')
    short_desc = data.get('short_description', '')

    # Build CTR-optimized title
    # Pattern: "{Name} Review {Year}: {Category} | {Price}"
    title_parts = [f"{name} Review {YEAR}"]

    if price_str and len(price_str) < 20:
        title_parts.append(f"Pricing {price_str}")

    title = ": ".join(title_parts)

    # If too long, simplify
    if len(title) > 55:
        title = f"{name} Review {YEAR}: Pricing, Pros & Cons"
    if len(title) > 55:
        title = f"{name} Review {YEAR}"

    # Build CTR-optimized description
    # Pattern: "{one_liner or short_desc}. {Price}. Compare features, pros & cons."
    desc_base = one_liner if one_liner else short_desc
    if desc_base:
        desc_base = truncate(desc_base, 100)
    else:
        desc_base = f"{name} for mental health professionals"

    if price_str:
        desc = f"{desc_base} Pricing from {price_str}. Compare features, pros & cons."
    else:
        desc = f"{desc_base} Compare features, pricing, pros & cons. See if it fits your practice."

    desc = truncate(desc, 160)

    # Update SEO
    if 'seo' not in data:
        data['seo'] = {}

    data['seo']['title'] = title
    data['seo']['meta_description'] = desc

    # Ensure FAQs array exists
    if 'faqs' not in data['seo']:
        data['seo']['faqs'] = []

    # Write back
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)

    UPDATED_COUNT += 1
    return True

# ============================================================================
# V3 PATIENT TOOLS
# ============================================================================

def optimize_patient_tool(filepath: Path) -> bool:
    """Optimize a V3 patient tool's SEO."""
    global UPDATED_COUNT, SKIPPED_COUNT

    with open(filepath, 'r') as f:
        data = json.load(f)

    name = data.get('name', '')
    if not name:
        return False

    # Skip if already optimized
    if has_good_seo(data.get('seo'), name):
        SKIPPED_COUNT += 1
        return False

    # Extract useful info
    pricing = data.get('pricing', {})
    price_str = extract_price(pricing)
    app_rating = data.get('app_rating')
    total_reviews = data.get('total_reviews')
    one_liner = data.get('one_liner', '')
    patient_summary = data.get('patient_summary', '')
    short_desc = data.get('short_description', '')

    # Build CTR-optimized title
    title_parts = [f"{name} Review {YEAR}"]

    # Add social proof
    if app_rating and app_rating >= 4.0:
        title_parts.append(f"({app_rating}★ Rating)")
    elif price_str and 'free' in str(price_str).lower():
        title_parts.append("(Free)")
    elif price_str and len(str(price_str)) < 15:
        title_parts.append(f"({price_str})")

    title = " ".join(title_parts)

    if len(title) > 55:
        title = f"{name} App Review {YEAR}"

    # Build description
    desc_base = patient_summary if patient_summary else (one_liner if one_liner else short_desc)
    if desc_base:
        desc_base = truncate(desc_base, 90)
    else:
        desc_base = f"{name} mental health app"

    # Add hooks
    extras = []
    if app_rating:
        extras.append(f"{app_rating}★ rating")
    if total_reviews and total_reviews > 1000:
        extras.append(f"{total_reviews:,}+ reviews")
    if price_str:
        extras.append(f"Pricing: {price_str}")

    if extras:
        desc = f"{desc_base} {'. '.join(extras[:2])}. Is it right for you?"
    else:
        desc = f"{desc_base} See features, pros & cons, and if it's right for you."

    desc = truncate(desc, 160)

    # Update SEO
    if 'seo' not in data:
        data['seo'] = {}

    data['seo']['title'] = title
    data['seo']['meta_description'] = desc

    if 'faqs' not in data['seo']:
        data['seo']['faqs'] = []

    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)

    UPDATED_COUNT += 1
    return True

# ============================================================================
# CONDITIONS
# ============================================================================

def optimize_condition(filepath: Path) -> bool:
    """Optimize a condition page's SEO."""
    global UPDATED_COUNT, SKIPPED_COUNT

    with open(filepath, 'r') as f:
        data = json.load(f)

    name = data.get('name', '')
    if not name:
        return False

    # Skip if already has SEO overrides that look optimized
    if has_good_seo(data.get('seo'), name):
        SKIPPED_COUNT += 1
        return False

    # Extract useful info
    metadata = data.get('metadata', {})
    content = data.get('content', {})

    # Build CTR-optimized title
    # Conditions need: Name, key symptoms/causes, treatment mention
    short_name = name.replace(' Disorder', '').replace(' Syndrome', '')

    # Try to find a hook from the content
    symptoms = content.get('symptoms', {})
    if isinstance(symptoms, dict):
        symptom_list = symptoms.get('behavioral', []) or symptoms.get('emotional', []) or []
    elif isinstance(symptoms, list):
        symptom_list = symptoms
    else:
        symptom_list = []

    if len(name) < 35:
        title = f"{name}: Symptoms, Causes & Treatment Guide"
    elif len(short_name) < 35:
        title = f"{short_name}: Symptoms, Causes & Treatment"
    else:
        title = f"{name}: Symptoms & Treatment"

    title = truncate(title, 58)

    # Build description - handle nested structure
    description_obj = content.get('description', {})
    if isinstance(description_obj, dict):
        description_text = description_obj.get('overview', '')
    else:
        description_text = str(description_obj) if description_obj else ''

    if description_text:
        # Extract first sentence
        first_sentence = description_text.split('.')[0] + '.'
        first_sentence = truncate(first_sentence, 80)
    else:
        # Try AEO what_is field
        aeo = content.get('aeo', {})
        if isinstance(aeo, dict) and aeo.get('what_is'):
            first_sentence = truncate(aeo['what_is'], 80)
        else:
            first_sentence = f"{name} affects mental health and daily functioning."

    desc = f"{first_sentence} Learn symptoms, causes, and evidence-based treatments. Find support and resources."
    desc = truncate(desc, 160)

    # Add/update SEO
    if 'seo' not in data:
        data['seo'] = {}

    data['seo']['title'] = title
    data['seo']['description'] = desc

    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)

    UPDATED_COUNT += 1
    return True

# ============================================================================
# TREATMENTS
# ============================================================================

def optimize_treatment(filepath: Path) -> bool:
    """Optimize a treatment page's SEO."""
    global UPDATED_COUNT, SKIPPED_COUNT

    with open(filepath, 'r') as f:
        data = json.load(f)

    # Handle both V2 and V3 schemas
    if 'identity' in data:
        # V3 schema
        name = data['identity'].get('name', '')
        generic = data['identity'].get('generic_name', '')
        brand_names = data['identity'].get('brand_names', [])
    else:
        # V2 schema
        name = data.get('name', '')
        generic = data.get('generic_name', '')
        brand_names = data.get('brand_names', [])

    if not name:
        return False

    # Skip if already optimized
    if has_good_seo(data.get('seo'), name):
        SKIPPED_COUNT += 1
        return False

    # Determine treatment type
    taxonomy = data.get('taxonomy', {})
    modality = taxonomy.get('modality', 'treatment')

    # Build title based on type
    if modality == 'medication':
        # Include brand name if available
        brand_str = f"({brand_names[0]})" if brand_names else ""
        if brand_str and len(f"{name} {brand_str}") < 40:
            title = f"{name} {brand_str}: Uses, Side Effects & Dosage"
        else:
            title = f"{name}: Uses, Side Effects & Dosage"
    elif modality == 'therapy':
        title = f"{name}: How It Works, Benefits & What to Expect"
    else:
        title = f"{name}: Benefits, How It Works & Effectiveness"

    title = truncate(title, 58)

    # Build description
    summary = data.get('summary', '') or data.get('description', '') or data.get('patient_summary', '')
    if summary:
        summary = truncate(summary, 80)
    else:
        summary = f"{name} is a {modality} for mental health"

    if modality == 'medication':
        desc = f"{summary}. Learn about dosing, side effects, interactions, and what to expect."
    else:
        desc = f"{summary}. Understand how it works, potential benefits, and if it's right for you."

    desc = truncate(desc, 160)

    # Update SEO
    if 'seo' not in data:
        data['seo'] = {}

    data['seo']['title'] = title
    data['seo']['description'] = desc

    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)

    UPDATED_COUNT += 1
    return True

# ============================================================================
# MAIN
# ============================================================================

def main():
    global UPDATED_COUNT, SKIPPED_COUNT

    base_path = Path('/Users/jack/heypsych/data')

    print("=" * 60)
    print("SEO OPTIMIZATION SCRIPT")
    print("=" * 60)

    # V4 Clinician Tools
    print("\n[1/4] Optimizing V4 Clinician Tools...")
    UPDATED_COUNT = 0
    SKIPPED_COUNT = 0
    v4_path = base_path / 'tools-v4' / 'products'
    for category_dir in v4_path.iterdir():
        if category_dir.is_dir():
            for filepath in category_dir.glob('*.json'):
                try:
                    optimize_clinician_tool(filepath)
                except Exception as e:
                    print(f"  Error processing {filepath.name}: {e}")
    print(f"  Updated: {UPDATED_COUNT}, Skipped (already optimized): {SKIPPED_COUNT}")

    # V3 Patient Tools
    print("\n[2/4] Optimizing V3 Patient Tools...")
    UPDATED_COUNT = 0
    SKIPPED_COUNT = 0
    v3_path = base_path / 'resources' / 'tools'
    for filepath in v3_path.glob('*.json'):
        try:
            optimize_patient_tool(filepath)
        except Exception as e:
            print(f"  Error processing {filepath.name}: {e}")
    print(f"  Updated: {UPDATED_COUNT}, Skipped (already optimized): {SKIPPED_COUNT}")

    # Conditions
    print("\n[3/4] Optimizing Conditions...")
    UPDATED_COUNT = 0
    SKIPPED_COUNT = 0
    conditions_path = base_path / 'conditions'
    for category_dir in conditions_path.iterdir():
        if category_dir.is_dir():
            for filepath in category_dir.glob('*.json'):
                try:
                    optimize_condition(filepath)
                except Exception as e:
                    print(f"  Error processing {filepath.name}: {e}")
    print(f"  Updated: {UPDATED_COUNT}, Skipped (already optimized): {SKIPPED_COUNT}")

    # Treatments
    print("\n[4/4] Optimizing Treatments...")
    UPDATED_COUNT = 0
    SKIPPED_COUNT = 0
    treatments_path = base_path / 'treatments'
    for category_dir in treatments_path.iterdir():
        if category_dir.is_dir() and category_dir.name != 'compare':
            for filepath in category_dir.glob('*.json'):
                if '.legacy.' not in filepath.name:
                    try:
                        optimize_treatment(filepath)
                    except Exception as e:
                        print(f"  Error processing {filepath.name}: {e}")
    print(f"  Updated: {UPDATED_COUNT}, Skipped (already optimized): {SKIPPED_COUNT}")

    print("\n" + "=" * 60)
    print("DONE!")
    print("=" * 60)

if __name__ == '__main__':
    main()
