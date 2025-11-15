# Crisis Hotlines A-Z Section

## Overview

The Crisis Hotlines A-Z Section is a comprehensive, searchable directory of specialized crisis hotlines for the HeyPsych Support & Community page. It features fuzzy search with typo tolerance, A-Z letter navigation, and an expandable international section.

## Features

### ✅ Implemented Features

1. **Comprehensive JSON Dataset** (`crisis_hotlines.json`)
   - 19 US specialized crisis hotlines
   - 1 international directory (Befrienders Worldwide)
   - Extended schema with rich metadata for future expansion

2. **Fuzzy Search with Typo Tolerance**
   - Case-insensitive, diacritic-insensitive matching
   - 1-2 character edit distance tolerance
   - Smart ranking: exact > prefix > keyword/tag > fuzzy

3. **Accessible UI Components**
   - ARIA live regions for search result announcements
   - Full keyboard navigation support
   - WCAG 2.1 AA contrast compliance
   - Screen reader friendly

4. **A-Z Navigation**
   - Desktop letter index for quick jumping
   - Automatic grouping by first letter (ignoring "The", "A", "An")
   - Anchor links for deep linking

5. **International Section**
   - Collapsed by default to prioritize US resources
   - Expandable toggle with smooth animation
   - Separate rendering for international hotlines

6. **SEO Optimization**
   - JSON-LD structured data (ItemList + Organization schema)
   - ContactPoint schema for phone numbers
   - Semantic HTML with proper heading hierarchy

7. **Consistent Styling**
   - Matches existing Crisis page design
   - Red accent colors for crisis context
   - Smooth animations and transitions
   - Responsive design (mobile-first)

## Architecture

### File Structure

```
/Users/jack/heypsych/
├── data/resources/support-community/
│   └── crisis_hotlines.json                    # Main dataset
├── src/
│   ├── components/support-community/
│   │   ├── CrisisAtoZSection.tsx              # Main container
│   │   ├── CrisisCard.tsx                      # Hotline card component
│   │   ├── CrisisSearchInput.tsx               # Search with ARIA live
│   │   ├── CrisisLetterIndex.tsx               # A-Z navigation
│   │   ├── InternationalToggle.tsx             # Expandable intl section
│   │   └── ImmediateCrisisTab.tsx              # Updated to include section
│   └── lib/
│       ├── hooks/
│       │   └── useFuzzySearch.ts               # Fuzzy search hook
│       └── loaders/
│           └── support-community-loader.ts     # Data loading functions
```

### Data Schema

The `crisis_hotlines.json` file uses an extended schema designed for comprehensive crisis resource management:

```typescript
interface Hotline {
  id: string;                    // Unique slug
  kind: "resource";
  type: "hotline" | "directory"; // Type of resource
  name: string;                   // Display name
  summary: string;                // ≤22 words, calm, stigma-free

  labels: {
    free: boolean;
    availability: "24/7" | "Hours vary" | "See site";
    focus: string[];              // Short badges (e.g., "LGBTQ+", "Veterans")
    audience?: string[];          // Optional audience tags
    verified: boolean;
  };

  org: {
    name: string;
    url?: string | null;
  };

  coverage: Array<{
    region: "US" | "INTL";
    scope: "national" | "global";
  }>;

  contacts: Array<{
    region: string;
    channels: {
      call?: Array<{ label: string; value: string | null }>;
      text?: Array<{ label: string; value: string | null }>;
      chat?: Array<{ label: string; value: string | null }>;
      tty?: Array<{ label: string; value: string | null }>;
    };
  }>;

  actions: {
    site_url?: string | null;
    chat_url?: string | null;
    text?: string | null;
    tty?: string | null;
  };

  taxonomy: {
    topics?: string[];            // Controlled vocabulary
    conditions?: string[];
    identities?: string[];        // Identity-based communities
  };

  search: {
    keywords?: string[];          // Synonyms for search
    aka?: string[];               // Alternative names
  };

  linkage: {
    see_also?: string[];          // Related hotline IDs
    supersedes?: string[];
    superseded_by?: string[];
  };

  compliance: {
    last_verified?: string | null;  // ISO date
    source_of_truth: "org-confirmed" | "public-website" | "publisher" | "user-report";
    notes?: string | null;
  };

  seo: {
    indexable: boolean;
    canonical?: string | null;
    schema_org: "Organization";
  };

  display: {
    pin: boolean;
    weight: number;               // For custom sorting
  };
}
```

### Search Algorithm

The `useFuzzySearch` hook implements a sophisticated search algorithm:

1. **Normalization**: Remove diacritics, convert to lowercase
2. **Matching Strategy**:
   - Exact match: 100 points
   - Prefix match: 90 points
   - Contains match: 60-80 points (position-weighted)
   - Fuzzy match: 30-50 points (edit distance-weighted)
3. **Field Priority** (highest to lowest):
   - Name
   - AKA (aliases)
   - Focus tags
   - Keywords
   - Identities
   - Audience
   - Topics
   - Conditions
   - Summary
4. **Typo Tolerance**:
   - ≤5 chars: 1 character edit distance
   - >5 chars: 2 character edit distance
5. **Sorting**: By score (descending), then alphabetically

### Accessibility Features

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **ARIA Live Regions**: Search results announced to screen readers
- **Focus Management**: Proper focus indicators and focus order
- **Semantic HTML**: Proper heading hierarchy, landmarks, and roles
- **Color Contrast**: All text meets WCAG 2.1 AA standards (≥4.5:1)
- **Alternative Text**: All icons have `aria-label` or are marked `aria-hidden`

## Content Guidelines

### Writing Summaries

Summaries should be:
- **≤22 words** (approximately one calm sentence)
- **Stigma-free**: Use person-first or identity-first language appropriately
- **Clear**: State who it's for + what support it offers
- **Reassuring**: Use calm, supportive tone

**Good Examples:**
- "24/7 crisis support for LGBTQ+ young people experiencing mental health crisis or suicidal thoughts."
- "Confidential crisis support for Veterans, service members, National Guard, Reserve, and their families."

**Avoid:**
- Medical jargon or clinical language
- Alarmist or frightening language
- Vague descriptions like "help for people in need"
- Marketing language or promotional content

### Focus Tags

Focus tags appear in the details bar. Keep them:
- **Short**: 1-2 words maximum
- **Specific**: "LGBTQ+" not "Community Support"
- **Identity/Situation-Based**: "Veterans", "Youth", "Postpartum"
- **Limited**: 2-4 tags per hotline maximum

### Keywords for Search

Include 3-6 keywords that people might search for:
- **Synonyms**: "domestic violence", "dating abuse"
- **Colloquialisms**: "ppd" for postpartum depression
- **Alternate Spellings**: "transgender", "trans"
- **Related Terms**: "veteran", "military", "ptsd"

## Adding or Editing Hotlines

### Step 1: Update the JSON

Edit `/data/resources/support-community/crisis_hotlines.json`:

```json
{
  "id": "new-hotline-slug",
  "kind": "resource",
  "type": "hotline",
  "name": "New Hotline Name",
  "summary": "Clear, calm summary in ≤22 words.",
  "labels": {
    "free": true,
    "availability": "24/7",
    "focus": ["Focus1", "Focus2"],
    "verified": true
  },
  "org": {
    "name": "Organization Name",
    "url": "https://example.org"
  },
  "coverage": [
    {
      "region": "US",
      "scope": "national"
    }
  ],
  "contacts": [
    {
      "region": "US",
      "channels": {
        "call": [{ "label": "Call", "value": "1-800-XXX-XXXX" }],
        "text": [{ "label": "Text", "value": "XXXXX" }],
        "chat": [{ "label": "Chat", "value": null }],
        "tty": []
      }
    }
  ],
  "actions": {
    "site_url": "https://example.org",
    "chat_url": "https://example.org/chat",
    "text": "XXXXX",
    "tty": null
  },
  "i18n": {
    "languages": ["English"],
    "accessibility": []
  },
  "taxonomy": {
    "topics": ["crisis"],
    "conditions": ["crisis"],
    "identities": []
  },
  "search": {
    "keywords": ["keyword1", "keyword2"],
    "aka": []
  },
  "linkage": {
    "see_also": [],
    "supersedes": [],
    "superseded_by": []
  },
  "compliance": {
    "last_verified": null,
    "source_of_truth": "public-website",
    "notes": null
  },
  "seo": {
    "indexable": true,
    "canonical": "/crisis/new-hotline-slug",
    "schema_org": "Organization"
  },
  "display": {
    "pin": false,
    "weight": 0
  }
}
```

### Step 2: Verify Contact Information

**DO NOT** add phone numbers, text numbers, or URLs unless you've verified them:

1. Visit the organization's official website
2. Confirm the numbers/URLs are current
3. Test the links if possible
4. Note the `source_of_truth` field

Leave values as `null` if unverified. This is safer than providing incorrect information.

### Step 3: Set Availability

Use these guidelines:

- **"24/7"**: Confirmed 24/7 availability
  - Veterans Crisis Line
  - National Domestic Violence Hotline
  - RAINN
  - SAMHSA
  - Disaster Distress Helpline
  - National Maternal Mental Health Hotline

- **"Hours vary"**: Known limited hours
  - Trans Lifeline
  - YouthLine
  - NAMI
  - ANAD
  - PSI
  - LGBT National Help Center

- **"See site"**: Unknown or variable hours

### Step 4: Update `last_verified`

When you verify information:

```json
"compliance": {
  "last_verified": "2025-01-10",
  "source_of_truth": "org-confirmed",
  "notes": "Verified via phone call with org on 2025-01-10"
}
```

### Step 5: Test Locally

1. Start the dev server: `npm run dev`
2. Navigate to Support & Community → Crisis tab
3. Verify:
   - Hotline appears in correct alphabetical position
   - Search finds it using name and keywords
   - Card displays all information correctly
   - Links work and open in new tabs

## Verification Workflow

### Regular Maintenance (Quarterly)

1. **Review all hotlines** for accuracy
2. **Test phone numbers** (if possible)
3. **Check website URLs** for broken links
4. **Update `last_verified`** dates
5. **Look for new hotlines** to add

### When to Update

- Organization changes name or branding
- Phone numbers or URLs change
- Availability hours change
- New contact methods added (e.g., chat)
- Organization ceases operations

### Deprecation Process

If a hotline is no longer active:

1. **DO NOT immediately remove** from JSON
2. Add a note to `compliance.notes`
3. Update `superseded_by` if there's a replacement
4. After 30 days, remove from `hotlines` array
5. Keep record in a `deprecated_hotlines` file (optional)

## Performance Considerations

### Search Performance

- **Target**: <100ms filtering latency
- **Implementation**: Client-side search (no network calls)
- **Optimization**: Memoized search results

### Rendering Performance

- **Staggered animations**: Delay increases prevent jank
- **Lazy rendering**: Only active tab is rendered
- **No heavy images**: Icons only, no photos

### Bundle Size

- **Search algorithm**: ~2KB minified
- **Components**: ~8KB minified
- **JSON data**: ~45KB uncompressed

## SEO Strategy

### JSON-LD Schema

The section generates structured data for search engines:

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "A-Z Specialized Crisis Hotlines",
  "numberOfItems": 19,
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "item": {
        "@type": "Organization",
        "@id": "https://heypsych.com/crisis/the-trevor-project",
        "name": "The Trevor Project",
        "url": "https://www.thetrevorproject.org",
        "description": "24/7 crisis support for LGBTQ+ young people...",
        "contactPoint": [
          {
            "@type": "ContactPoint",
            "telephone": "...",
            "contactType": "Crisis Hotline"
          }
        ]
      }
    }
  ]
}
```

### Canonical URLs

Each hotline has a canonical URL for future individual pages:
- Format: `/crisis/{hotline-id}`
- Currently redirects to main crisis page
- Ready for dedicated hotline pages in future

## Analytics

### Tracked Events

The implementation tracks these events for analytics:

1. **crisis_hotline_action**
   - `hotline_id`: Hotline slug
   - `action_type`: "visit_site", "call", "text", "chat"

2. **international_toggle**
   - `event_label`: "expand" or "collapse"

3. **tab_change** (existing)
   - `event_label`: "crisis"

### GA4 Query Examples

**Most clicked hotlines:**
```
event_name = "crisis_hotline_action"
GROUP BY hotline_id
ORDER BY count DESC
```

**Popular action types:**
```
event_name = "crisis_hotline_action"
GROUP BY action_type
ORDER BY count DESC
```

## Testing Checklist

### Unit Tests

- [ ] Fuzzy search with exact match
- [ ] Fuzzy search with typos (1-2 char distance)
- [ ] Case-insensitive search
- [ ] Diacritic-insensitive search
- [ ] Keyword matching
- [ ] Identity/topic matching
- [ ] A-Z grouping (ignoring "The", "A", "An")
- [ ] Letter extraction

### Integration Tests

- [ ] Typing "veterans" isolates Veterans Crisis Line
- [ ] Typing "postpartum" finds Maternal + PSI hotlines
- [ ] Typing "lgbtq" finds Trevor, Trans Lifeline, LGBT Center
- [ ] Expanding international reveals Befrienders
- [ ] Empty search shows all US hotlines
- [ ] Letter index navigation works
- [ ] ARIA live announces result counts

### Accessibility Tests

- [ ] Keyboard-only navigation works
- [ ] Screen reader announces search results
- [ ] Focus indicators visible
- [ ] Color contrast ≥4.5:1
- [ ] All interactive elements have labels
- [ ] Heading hierarchy correct
- [ ] Skip links work (if applicable)

### Browser Tests

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Future Enhancements

### Potential Features

1. **Individual Hotline Pages** (`/crisis/{slug}`)
   - Detailed information
   - User reviews/ratings
   - Related resources
   - FAQ section

2. **Filtering by Category**
   - Filter by identity (LGBTQ+, Veterans, etc.)
   - Filter by type (peer support, professional, etc.)
   - Filter by language

3. **Multilingual Support**
   - Spanish translations
   - Other languages based on demand

4. **User Contributions**
   - Community-submitted hotlines
   - Verification by moderators
   - Rating system

5. **Geolocation**
   - Prioritize local/state hotlines
   - International detection

6. **Saved/Favorited Hotlines**
   - User accounts
   - Quick access to saved resources

## Troubleshooting

### Common Issues

**Issue**: Hotline doesn't appear in search
- Check `search.keywords` array
- Verify `name` and `summary` fields
- Check for typos in JSON

**Issue**: Letter index button disabled
- Ensure hotline name starts with that letter (after removing "The", etc.)
- Check A-Z grouping logic

**Issue**: International section empty
- Verify `coverage[].region` is set to "INTL"
- Check `usHotlines` vs `internationalHotlines` filtering

**Issue**: ARIA live not announcing
- Check browser console for errors
- Verify `resultCount` prop is passed correctly
- Test with actual screen reader (NVDA, JAWS, VoiceOver)

## Support

For questions or issues with the Crisis Hotlines feature:

1. Check this documentation first
2. Review the JSON schema and examples
3. Look at existing hotlines for reference
4. Open a GitHub issue with specific details

## License

This feature is part of the HeyPsych project and follows the same license.

---

**Last Updated**: January 10, 2025
**Version**: 1.0
**Maintainer**: HeyPsych Team
