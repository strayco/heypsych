# Follow-Up: Shorten 7 Digital Tool SEO Titles

**Status:** Non-blocking, Ship-and-iterate
**Priority:** Low
**Effort:** 30 minutes
**Category:** SEO Optimization

## Context

7 digital tool resources have SEO titles >60 chars (will be truncated in SERPs). All are in the `digital-tools` category. This is a cosmetic issue - pages function correctly and validation passes.

## Goal

Shorten titles to ≤60 chars while preserving:
- Brand name
- Primary value prop
- Star rating (if present)
- Differentiator

## Resources to Fix

| Slug | Current Length | Current Title |
|------|----------------|---------------|
| deepscribe | 63 chars | DeepScribe: Ambient AI Medical Scribe for Clinicians \| HeyPsych |
| happify | 76 chars | Happify: CBT & Positive Psychology App for Stress, Anxiety & Mood \| HeyPsych |
| headspace | 72 chars | Headspace: 4.8★ Meditation & Sleep App - 14% Stress Reduction \| HeyPsych |
| insight-timer | 73 chars | Insight Timer: 4.8★ Free Meditation App – 250,000+ Meditations \| HeyPsych |
| mindshift-cbt | 67 chars | MindShift CBT: Free Anxiety Relief App (Sunsetting 2025) \| HeyPsych |
| woebot | 79 chars | Woebot: 4.7★ AI Mental Health Chatbot \| Depression & Anxiety Support \| HeyPsych |
| wysa | 67 chars | Wysa: 4.6★ AI Mental Health Chatbot for Anxiety & Stress \| HeyPsych |

## Suggested Shortened Titles (all ≤60 chars)

```json
{
  "deepscribe": "DeepScribe: AI Medical Scribe | HeyPsych",
  "happify": "Happify: CBT App for Anxiety & Mood | HeyPsych",
  "headspace": "Headspace: 4.8★ Meditation & Sleep App | HeyPsych",
  "insight-timer": "Insight Timer: 4.8★ Free Meditation App | HeyPsych",
  "mindshift-cbt": "MindShift CBT: Anxiety Relief App | HeyPsych",
  "woebot": "Woebot: 4.7★ AI Mental Health Chatbot | HeyPsych",
  "wysa": "Wysa: 4.6★ AI Chatbot for Anxiety | HeyPsych"
}
```

## Implementation

1. Edit the 7 JSON files in `data/resources/digital-tools/`
2. Update the auto-generated `title` field (or add custom SEO title)
3. Run `npm run validate:resources` to confirm ≤60 chars
4. Rebuild index: `npm run build:index`
5. Commit with message: "seo: shorten 7 digital tool titles to ≤60 chars"

## Validation

After changes:
```bash
npm run validate:resources
# Should show: ✅ SEO Metadata: 0 title warnings
```

## Notes

- URLs don't change (slugs stay the same)
- Full descriptions remain in meta description
- This only affects the `<title>` tag
- Can be done anytime (non-blocking for launch)
