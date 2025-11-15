# Sentry Configuration Files

This directory contains Sentry monitoring configuration files for HeyPsych.

## Files

- **`dashboard-config.json`** - Dashboard widget configuration
- **`alert-rules.json`** - Alert rule definitions
- **`README.md`** - This file

## Setup Instructions

### 1. Dashboard Setup (Manual)

Since Sentry doesn't support dashboard import via config files, create the dashboard manually:

1. Navigate to: https://sentry.io/organizations/strayco/dashboards/
2. Click "Create Dashboard"
3. Name: `HeyPsych Production Monitoring`
4. Use `dashboard-config.json` as a reference to add each widget

**Quick Setup:**
- Copy the widget configurations from `dashboard-config.json`
- Add each widget type (line, table, bar) as specified
- Configure queries and conditions as documented

### 2. Alert Rules Setup (Manual)

Alert rules must be created in the Sentry UI:

1. Navigate to: https://sentry.io/organizations/strayco/alerts/rules/
2. Click "Create Alert Rule"
3. Use `alert-rules.json` as a reference for:
   - Alert conditions
   - Thresholds
   - Time windows
   - Notification channels

**Critical Alerts to Create First:**
- Search API p95 > 400ms (Rollback threshold)
- Error Rate > 2%
- Database Query Failures

**See:** [SENTRY_MONITORING.md](../docs/SENTRY_MONITORING.md) for detailed setup steps.

### 3. Notification Channels

Configure notification channels before setting up alerts:

**Email:**
- Add engineering team email addresses
- Verify email delivery

**Slack:**
- Install Sentry Slack app
- Configure channels: `#alerts-critical`, `#alerts-monitoring`
- Test notifications

**PagerDuty (Optional):**
- Connect PagerDuty integration
- Set up on-call rotation
- Test escalation policies

## Performance Targets

Based on [DEPLOYMENT_RUNBOOK.md](../docs/DEPLOYMENT_RUNBOOK.md):

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Search p95 | <100ms | >250ms | >400ms |
| Provider Search p95 | <100ms | >250ms | >500ms |
| Error Rate | <0.1% | >1% | >2% |
| Page TTFB | <50ms | >100ms | >200ms |

## Custom Metrics

### Tracked Metrics

**`search.duration`** (Distribution)
- Location: `src/app/api/search/route.ts:80`
- Tags: `query_length`, `result_count`, `has_type_filter`
- Unit: milliseconds

**`provider_search.duration`** (Distribution)
- Location: `src/app/api/providers/search/route.ts:144`
- Tags: `has_state`, `has_city`, `has_specialization`, `result_count`
- Unit: milliseconds

## Documentation

For complete monitoring documentation, see:
- [SENTRY_MONITORING.md](../docs/SENTRY_MONITORING.md)
- [DEPLOYMENT_RUNBOOK.md](../docs/DEPLOYMENT_RUNBOOK.md)

## Support

**Sentry Project:** https://sentry.io/organizations/strayco/projects/javascript-nextjs/
**Engineering Team:** [Your Team]
**Last Updated:** 2025-11-15
