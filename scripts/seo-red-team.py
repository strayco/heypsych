#!/usr/bin/env python3
"""
SEO RED TEAM - Aggressive CTR optimization for EVERY page.

POWER TACTICS:
1. Numbers in titles (10x more clicks)
2. Brackets/parentheses (38% higher CTR)
3. Power words: Free, Best, Proven, Guide, Review, vs
4. Year for freshness (2026)
5. Pricing creates urgency
6. Questions create curiosity
7. Specificity beats generic
8. Match EXACT search intent
"""

import json
import os
import re
from pathlib import Path
from typing import Optional

YEAR = "2026"

def truncate(text: str, max_len: int) -> str:
    if not text:
        return ""
    if len(text) <= max_len:
        return text
    return text[:max_len-3].rsplit(' ', 1)[0] + "..."

def clean_price(price) -> str:
    """Clean and format price for display."""
    if not price:
        return ""
    price_str = str(price)
    # Remove "starting at" type prefixes
    price_str = re.sub(r'^(starting\s+(at|from)|from)\s*', '', price_str, flags=re.I)
    return price_str.strip()

def extract_number(data: dict) -> Optional[str]:
    """Extract any impressive number from the data."""
    # Try various fields for social proof numbers
    if data.get('total_reviews') and data['total_reviews'] > 1000:
        return f"{data['total_reviews']:,}+ reviews"
    if data.get('app_rating') and data['app_rating'] >= 4.0:
        return f"{data['app_rating']}★"
    # Look in long description for numbers
    desc = data.get('long_description', '')
    # Find patterns like "10,000+" or "50 million"
    match = re.search(r'(\d{1,3}(?:,\d{3})+\+?|\d+\s*(?:million|billion|k\+|M\+))', desc)
    if match:
        return match.group(1)
    return None

# ============================================================================
# V4 CLINICIAN TOOLS - Aggressive
# ============================================================================

def redteam_clinician_tool(filepath: Path) -> bool:
    with open(filepath, 'r') as f:
        data = json.load(f)

    name = data.get('name', '')
    if not name:
        return False

    # Extract all useful data
    pricing = data.get('pricing', {}) or {}
    price = clean_price(pricing.get('starting_price_display') or pricing.get('starting_price'))
    category = data.get('primary_category', '').replace('-', ' ').title()
    one_liner = data.get('one_liner', '')
    short_desc = data.get('short_description', '')

    # Feature flags for hooks
    flags = data.get('feature_flags', {}) or {}
    has_ai = flags.get('has_ai', False)
    has_free = pricing.get('free_tier', False)

    # Audiences for targeting
    audiences = data.get('audiences', {}) or {}
    sizes = audiences.get('organization_sizes', [])

    # Build AGGRESSIVE title
    # Pattern: "{Name} Review {Year}: {Hook} | {Price}"

    hooks = []
    if has_ai:
        hooks.append("AI-Powered")
    if has_free:
        hooks.append("Free Tier")
    if 'solo' in sizes:
        hooks.append("Solo Practice")
    elif 'enterprise' in str(sizes):
        hooks.append("Enterprise")

    if price and '$' in price:
        price_hook = f"From {price}"
    elif price:
        price_hook = price
    else:
        price_hook = "Pricing"

    # Try different title formats based on what we have
    if hooks and price:
        title = f"{name} Review {YEAR}: {hooks[0]} ({price_hook})"
    elif price:
        title = f"{name} Review {YEAR}: {price_hook}, Pros & Cons"
    elif hooks:
        title = f"{name} Review {YEAR}: {hooks[0]} | Pros & Cons"
    else:
        title = f"{name} Review {YEAR}: Features, Pricing & Verdict"

    # Truncate if needed
    if len(title) > 58:
        title = f"{name} Review {YEAR}: Pricing & Pros/Cons"
    if len(title) > 58:
        title = f"{name} Review {YEAR}"

    # Build AGGRESSIVE description
    # Lead with value prop, include price, end with CTA

    desc_parts = []

    # Start with one-liner or value prop
    if one_liner:
        desc_parts.append(truncate(one_liner, 70))
    elif short_desc:
        desc_parts.append(truncate(short_desc, 70))
    else:
        desc_parts.append(f"{name} for mental health professionals")

    # Add price hook
    if price:
        desc_parts.append(f"Pricing from {price}.")

    # Add differentiator
    if has_ai:
        desc_parts.append("AI-powered.")
    elif has_free:
        desc_parts.append("Free tier available.")

    # CTA
    desc_parts.append("Compare features, see if it fits your practice.")

    desc = " ".join(desc_parts)
    desc = truncate(desc, 160)

    # Update
    if 'seo' not in data:
        data['seo'] = {}
    data['seo']['title'] = title
    data['seo']['meta_description'] = desc

    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)

    return True

# ============================================================================
# V3 PATIENT TOOLS - Aggressive
# ============================================================================

def redteam_patient_tool(filepath: Path) -> bool:
    with open(filepath, 'r') as f:
        data = json.load(f)

    name = data.get('name', '')
    if not name:
        return False

    # Extract data
    pricing = data.get('pricing', {}) or {}
    price_model = pricing.get('model', '')
    is_free = pricing.get('free_tier', False) or 'free' in str(price_model).lower()
    price = clean_price(pricing.get('starting_price'))

    rating = data.get('app_rating')
    reviews = data.get('total_reviews')
    one_liner = data.get('one_liner', '')
    patient_summary = data.get('patient_summary', '')

    # Conditions targeted
    conditions = data.get('conditions', [])
    primary_hubs = data.get('primary_hubs', [])

    # Build AGGRESSIVE title
    # Patients want: Does it work? How much? Is it legit?

    hooks = []

    # Rating is GOLD for CTR
    if rating and rating >= 4.0:
        hooks.append(f"({rating}★)")

    # Free is GOLD
    if is_free:
        hooks.append("(Free)")
    elif price:
        hooks.append(f"({price})")

    # Reviews count = social proof
    if reviews and reviews > 5000:
        hooks.append(f"({reviews//1000}K+ Reviews)")

    # Build title with best hook
    if hooks:
        title = f"{name} App Review {YEAR}: {hooks[0]}"
    else:
        title = f"{name} App Review {YEAR}: Honest Verdict"

    if len(title) > 58:
        title = f"{name} Review {YEAR}"

    # Build AGGRESSIVE description
    # Patients want to know: Will this help ME?

    desc_parts = []

    # Lead with what it does
    if patient_summary:
        desc_parts.append(truncate(patient_summary, 60))
    elif one_liner:
        desc_parts.append(truncate(one_liner, 60))

    # Social proof
    if rating and reviews:
        desc_parts.append(f"{rating}★ rating from {reviews:,}+ users.")
    elif rating:
        desc_parts.append(f"{rating}★ rated.")

    # Price/free hook
    if is_free:
        desc_parts.append("Free to use.")
    elif price:
        desc_parts.append(f"Pricing: {price}.")

    # CTA with curiosity
    desc_parts.append("See if it's right for you.")

    desc = " ".join(desc_parts)
    desc = truncate(desc, 160)

    # Update
    if 'seo' not in data:
        data['seo'] = {}
    data['seo']['title'] = title
    data['seo']['meta_description'] = desc

    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)

    return True

# ============================================================================
# CONDITIONS - Aggressive
# ============================================================================

def redteam_condition(filepath: Path) -> bool:
    with open(filepath, 'r') as f:
        data = json.load(f)

    name = data.get('name', '')
    if not name:
        return False

    content = data.get('content', {})
    metadata = data.get('metadata', {})

    # Get description
    desc_obj = content.get('description', {})
    if isinstance(desc_obj, dict):
        overview = desc_obj.get('overview', '')
    else:
        overview = str(desc_obj) if desc_obj else ''

    # Get AEO answer
    aeo = content.get('aeo', {})
    what_is = aeo.get('what_is', '') if isinstance(aeo, dict) else ''

    # Get symptoms for hooks
    symptoms = content.get('symptoms', {})
    if isinstance(symptoms, dict):
        symptom_list = symptoms.get('behavioral', []) or symptoms.get('emotional', []) or symptoms.get('core', [])
    elif isinstance(symptoms, list):
        symptom_list = symptoms
    else:
        symptom_list = []

    # Count symptoms for title hook
    symptom_count = len(symptom_list) if symptom_list else None

    # Build AGGRESSIVE title
    # People searching conditions want: Do I have this? What do I do?

    short_name = name.replace(' Disorder', '').replace(' Syndrome', '')

    # Try to add a number or hook
    if symptom_count and symptom_count >= 5:
        title = f"{short_name}: {symptom_count} Key Symptoms & Treatment"
    elif len(name) < 40:
        title = f"{name}: Signs, Symptoms & Treatment Options"
    else:
        title = f"{short_name}: Symptoms & Treatment Guide"

    title = truncate(title, 58)

    # Build AGGRESSIVE description
    # Lead with what_is (direct answer), then CTA

    if what_is:
        lead = truncate(what_is, 80)
    elif overview:
        # Get first sentence
        lead = overview.split('.')[0] + '.'
        lead = truncate(lead, 80)
    else:
        lead = f"{name} is a mental health condition that affects daily life."

    desc = f"{lead} Learn the warning signs, causes, and proven treatments. Take the first step."
    desc = truncate(desc, 160)

    # Update
    if 'seo' not in data:
        data['seo'] = {}
    data['seo']['title'] = title
    data['seo']['description'] = desc

    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)

    return True

# ============================================================================
# TREATMENTS - Aggressive
# ============================================================================

def redteam_treatment(filepath: Path) -> bool:
    with open(filepath, 'r') as f:
        data = json.load(f)

    # Handle V2 and V3 schemas
    if 'identity' in data:
        name = data['identity'].get('name', '')
        brand_names = data['identity'].get('brand_names', [])
    else:
        name = data.get('name', '')
        brand_names = data.get('brand_names', [])

    if not name:
        return False

    # Get taxonomy
    taxonomy = data.get('taxonomy', {})
    modality = taxonomy.get('modality', 'treatment')
    drug_classes = taxonomy.get('drug_classes', [])

    # Get clinical profile
    clinical = data.get('clinical_profile', {}) or {}
    evidence = clinical.get('evidence', {}) or {}
    evidence_level = evidence.get('level', '')

    # Get summary
    summary = data.get('summary', '') or data.get('patient_summary', '') or data.get('description', '')

    # Build AGGRESSIVE title based on modality

    brand_str = f"({brand_names[0]})" if brand_names else ""

    if modality == 'medication':
        # Medication searches: What is it for? Side effects? Does it work?
        if brand_str and len(f"{name} {brand_str}") < 35:
            title = f"{name} {brand_str}: Uses, Dosage & Side Effects"
        else:
            title = f"{name}: Uses, Dosage & Side Effects Guide"

    elif modality == 'therapy':
        # Therapy searches: Does it work? What happens?
        if evidence_level in ['high', 'strong']:
            title = f"{name}: Evidence-Based Therapy Guide"
        else:
            title = f"{name}: How It Works & What to Expect"

    elif modality == 'supplement':
        # Supplement searches: Does it actually work?
        title = f"{name}: Benefits, Dosage & Does It Work?"

    else:
        title = f"{name}: Benefits, Risks & What to Expect"

    title = truncate(title, 58)

    # Build AGGRESSIVE description

    if summary:
        lead = truncate(summary, 70)
    else:
        lead = f"{name} is used for mental health treatment"

    if modality == 'medication':
        desc = f"{lead}. Dosing, side effects, interactions & what patients say. Make an informed choice."
    elif modality == 'therapy':
        desc = f"{lead}. See how it works, what a session looks like, and if it's right for you."
    else:
        desc = f"{lead}. Evidence, benefits, risks & real experiences. Know before you try."

    desc = truncate(desc, 160)

    # Update
    if 'seo' not in data:
        data['seo'] = {}
    data['seo']['title'] = title
    data['seo']['description'] = desc

    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)

    return True

# ============================================================================
# MAIN
# ============================================================================

def main():
    base_path = Path('/Users/jack/heypsych/data')

    print("=" * 60)
    print("SEO RED TEAM - AGGRESSIVE OPTIMIZATION")
    print("=" * 60)

    total_updated = 0

    # V4 Clinician Tools
    print("\n[1/4] Red teaming V4 Clinician Tools...")
    count = 0
    v4_path = base_path / 'tools-v4' / 'products'
    for category_dir in v4_path.iterdir():
        if category_dir.is_dir():
            for filepath in category_dir.glob('*.json'):
                try:
                    if redteam_clinician_tool(filepath):
                        count += 1
                except Exception as e:
                    print(f"  Error: {filepath.name}: {e}")
    print(f"  Updated: {count}")
    total_updated += count

    # V3 Patient Tools
    print("\n[2/4] Red teaming V3 Patient Tools...")
    count = 0
    v3_path = base_path / 'resources' / 'tools'
    for filepath in v3_path.glob('*.json'):
        try:
            if redteam_patient_tool(filepath):
                count += 1
        except Exception as e:
            print(f"  Error: {filepath.name}: {e}")
    print(f"  Updated: {count}")
    total_updated += count

    # Conditions
    print("\n[3/4] Red teaming Conditions...")
    count = 0
    conditions_path = base_path / 'conditions'
    for category_dir in conditions_path.iterdir():
        if category_dir.is_dir() and not category_dir.name.startswith('_'):
            for filepath in category_dir.glob('*.json'):
                try:
                    if redteam_condition(filepath):
                        count += 1
                except Exception as e:
                    print(f"  Error: {filepath.name}: {e}")
    print(f"  Updated: {count}")
    total_updated += count

    # Treatments
    print("\n[4/4] Red teaming Treatments...")
    count = 0
    treatments_path = base_path / 'treatments'
    for category_dir in treatments_path.iterdir():
        if category_dir.is_dir() and category_dir.name != 'compare':
            for filepath in category_dir.glob('*.json'):
                if '.legacy.' not in filepath.name:
                    try:
                        if redteam_treatment(filepath):
                            count += 1
                    except Exception as e:
                        print(f"  Error: {filepath.name}: {e}")
    print(f"  Updated: {count}")
    total_updated += count

    print("\n" + "=" * 60)
    print(f"TOTAL PAGES RED TEAMED: {total_updated}")
    print("=" * 60)

if __name__ == '__main__':
    main()
