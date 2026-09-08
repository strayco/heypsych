# Commercial Classification Audit

> Phase 6 completion: Classification of existing affiliate URLs

**Audit Date:** 2026-09-02
**Auditor:** Automated analysis
**Scope:** All `affiliate_url` fields in data files

## Summary

| Category | Count | Status |
|----------|-------|--------|
| Total files with `affiliate_url` | 1,216 | - |
| Verified affiliate tracking URLs | 1 | `active_affiliate` |
| Plain website URLs (no tracking) | 1,215 | Default to `unknown` |
| Files with `commercial` field added | 1 | - |

## Classification Results

### Active Affiliates (1)

| File | URL | Evidence | Status |
|------|-----|----------|--------|
| `data/tools-v4/products/billing-rcm/hayat-health.json` | `https://hayathealth.us/?ref=heypsych` | Has `?ref=heypsych` tracking parameter | `active_affiliate` |

### Unclassified (1,215)

All other `affiliate_url` fields contain plain vendor website URLs without any tracking parameters:
- No UTM parameters
- No affiliate network URLs (ShareASale, Impact, CJ, etc.)
- No referral codes
- No partner IDs

These remain at the schema default status of `unknown` until:
1. A commercial agreement is established
2. An affiliate tracking URL is configured
3. The relationship is verified

## Classification Criteria

Per the Phase 6 implementation:

| Status | Criteria | Disclosure Required |
|--------|----------|---------------------|
| `active_affiliate` | Verified commission agreement in effect with tracking URL | Yes |
| `inactive_affiliate` | Previously had agreement, no longer active | No |
| `sponsored` | Paid placement (separate from affiliate) | Yes |
| `direct_link` | No commission, just vendor URL (explicitly classified) | No |
| `unknown` | Not yet classified (default) | No |

## Next Steps

When establishing new affiliate relationships:

1. Configure tracking URL with partner
2. Update product JSON file:
   ```json
   "affiliate_url": "https://vendor.com/?ref=heypsych",
   "commercial": {
     "status": "active_affiliate",
     "partnerNetwork": "direct",
     "commissionType": "cpa|revenue_share|flat_rate",
     "verifiedAt": "YYYY-MM-DD",
     "notes": "Description of relationship"
   }
   ```
3. Kill switch will automatically apply disclosure when `status` is compensated

## Kill Switch Configuration

To disable affiliate links at runtime:

```bash
# Global disable
COMMERCIAL_KILL_SWITCH_GLOBAL=true

# Per-partner disable
COMMERCIAL_DISABLED_PARTNERS=direct,shareasale

# Per-product disable
COMMERCIAL_DISABLED_PRODUCTS=hayat-health

# Reason (for audit)
COMMERCIAL_DISABLE_REASON="Compliance review pending"
```

## Schema Reference

- Commercial schema: `src/lib/schemas/commercial.ts`
- Kill switch: `src/lib/commercial/kill-switch.ts`
- Disclosure components: `src/components/tools/AffiliateDisclosure.tsx`
- Isolation tests: `src/domains/architect/__tests__/commercial-isolation.test.ts`
