# Decision Platform Events Contract

> Phase 0A deliverable for the HeyPsych Decision Platform.
> Defines privacy-safe analytics events for decision journeys.

## 1. Principles

1. **No health content in events** — Symptom selections, assessment answers, concerns, and free-text are never transmitted
2. **Counts over content** — Use counts (e.g., `concernCount: 3`) instead of values
3. **Buckets over precision** — Use ranges for scores, budgets, durations
4. **Session, not user** — Events use anonymous session IDs, no user identifiers
5. **Separately joined** — Commercial events are distinct from journey events

## 2. Shared Event Schema

All decision events follow this base shape:

```typescript
interface DecisionEventBase {
  event: string;                    // Event name
  sessionId: string;                // Anonymous session ID (UUID)
  timestamp: string;                // ISO 8601
  audience: 'patient' | 'clinician';
  journeyId: string;                // e.g., 'practice-stack-builder', 'find-support-path'
  journeyVersion: string;           // Contract version
}
```

## 3. Lifecycle Events

### Journey Start

```typescript
decision_journey_started: {
  ...DecisionEventBase,
  source: 'homepage' | 'nav' | 'direct' | 'search',
  referrer?: string                 // Sanitized referrer domain only
}
```

### Journey Progress

```typescript
decision_step_completed: {
  ...DecisionEventBase,
  stepId: string,                   // e.g., 'urgency-check', 'practice-type'
  stepIndex: number,
  totalSteps: number,
  skipped: boolean
}
```

### Journey Completion

```typescript
decision_journey_completed: {
  ...DecisionEventBase,
  completedSteps: number,
  totalSteps: number,
  durationBucket: '<1m' | '1-3m' | '3-5m' | '5-10m' | '10-20m' | '20m+',
  resultType: string,               // e.g., 'recommendation', 'crisis', 'exploration'
  confidenceBucket: 'low' | 'limited' | 'moderate' | 'high'
}
```

### Journey Abandonment

```typescript
decision_journey_abandoned: {
  ...DecisionEventBase,
  lastStepId: string,
  lastStepIndex: number,
  durationBucket: '<1m' | '1-3m' | '3-5m' | '5-10m' | '10-20m' | '20m+'
}
```

## 4. Result Events

### Recommendation Shown

```typescript
decision_result_shown: {
  ...DecisionEventBase,
  resultCount: number,              // Number of recommendations/paths
  primaryResultId: string,          // Product slug or path ID
  hasAlternatives: boolean,
  confidenceBucket: 'low' | 'limited' | 'moderate' | 'high',
  // Clinician-specific (bucketed)
  coverageBucket?: '0-25' | '26-50' | '51-75' | '76-100',
  budgetStatus?: 'within' | 'over' | 'unknown',
  // Patient-specific
  hadCrisisSignal?: boolean
}
```

### Action Taken

```typescript
decision_action_taken: {
  ...DecisionEventBase,
  actionType: 'save' | 'compare' | 'detail' | 'external' | 'reset' | 'find-provider' | 'assessment',
  resultId?: string                 // Which result this action relates to
}
```

## 5. Safety Events (Patient Only)

### Crisis Signal

```typescript
crisis_signal_detected: {
  ...DecisionEventBase,
  trigger: 'urgency-selection' | 'keyword-detection' | 'assessment-alert',
  resourcesShown: boolean
}
```

**Note:** This event fires when crisis resources are displayed. It does NOT include:
- Which keywords were detected
- What the user typed
- Assessment scores or answers

## 6. Commercial Events (Separate Pipeline)

Commercial events are tracked separately and never influence organic recommendations:

```typescript
// Clinician only
commercial_cta_shown: {
  sessionId: string,
  productSlug: string,
  ctaType: 'demo' | 'quote' | 'visit' | 'affiliate',
  position: 'recommendation' | 'detail' | 'comparison'
}

commercial_cta_clicked: {
  sessionId: string,
  productSlug: string,
  ctaType: 'demo' | 'quote' | 'visit' | 'affiliate'
}
```

**Patient journeys have NO commercial events in the decision flow.** Commercial actions appear only on destination pages.

## 7. Clarity Measurement

To measure decision confidence lift:

```typescript
// Optional post-journey survey (never required)
clarity_reported: {
  sessionId: string,
  journeyId: string,
  clarityBefore: 1 | 2 | 3 | 4 | 5,   // Self-reported
  clarityAfter: 1 | 2 | 3 | 4 | 5,    // Self-reported
  foundHelpful: boolean
}
```

**Important:** Clarity is user-reported, never inferred from clicks.

## 8. Prohibited Data

The following MUST NEVER appear in any event:

| Data Type | Example | Why Prohibited |
|-----------|---------|----------------|
| Symptom selections | `concerns: ['anxiety', 'depression']` | Health content |
| Assessment answers | `answers: [3, 2, 4, 1]` | Health content |
| Assessment scores | `phq9Score: 15` | Health indicator |
| Free-text input | `userText: "I feel..."` | Health content |
| Diagnosis mentions | `condition: 'bipolar'` | Health content |
| Budget amounts | `budget: 150` | Use buckets |
| Provider counts | `providers: 7` | Use buckets |
| State lists | `states: ['CA', 'NY']` | Geographic PII |
| User identifiers | `userId`, `email` | PII |

## 9. Bucket Definitions

### Duration Buckets

| Bucket | Range |
|--------|-------|
| `<1m` | 0-59 seconds |
| `1-3m` | 60-179 seconds |
| `3-5m` | 180-299 seconds |
| `5-10m` | 300-599 seconds |
| `10-20m` | 600-1199 seconds |
| `20m+` | 1200+ seconds |

### Score/Confidence Buckets

| Bucket | Range |
|--------|-------|
| `low` | 0-39 |
| `limited` | 40-59 |
| `moderate` | 60-79 |
| `high` | 80-100 |

### Coverage Buckets (Clinician)

| Bucket | Range |
|--------|-------|
| `0-25` | 0-25% |
| `26-50` | 26-50% |
| `51-75` | 51-75% |
| `76-100` | 76-100% |

### Cost Buckets (Clinician)

| Bucket | Range |
|--------|-------|
| `under-100` | $0-99/month |
| `100-249` | $100-249/month |
| `250-499` | $250-499/month |
| `500-999` | $500-999/month |
| `1k-2.5k` | $1,000-2,499/month |
| `2.5k-5k` | $2,500-4,999/month |
| `5k+` | $5,000+/month |

### Provider Count Buckets (Clinician)

| Bucket | Range |
|--------|-------|
| `solo` | 1 |
| `2-5` | 2-5 |
| `6-15` | 6-15 |
| `16-30` | 16-30 |
| `31-100` | 31-100 |
| `100+` | 101+ |

## 10. Session Context and Attribution (Phase 6)

### Decision Session Context

Events are linked via a shared `sessionId` that persists across the decision journey:

```typescript
interface DecisionSessionContext {
  sessionId: string;      // Privacy-safe, not user-identifying
  decisionType: string;   // "patient-support" | "architect"
  startedAt: number;      // Timestamp for duration calculation
  primaryResultId?: string; // Set when result is shown
  hadSafetySignal?: boolean;
  source?: string;        // Entry source
}
```

### Attribution Funnel

The session context enables tracking this conversion funnel:

```
decision_started (sessionId)
    ↓
decision_step_completed (sessionId)  [0-n times]
    ↓
decision_result_shown (sessionId, resultId)
    ↓
decision_action_clicked (sessionId, resultId, isCommercial)
    ↓
decision_completed (sessionId)
```

All events share the same `sessionId`, allowing analysis of:
- Which decision paths lead to action clicks
- Conversion rate from result shown to action
- Time from decision start to action
- Commercial vs non-commercial action rates

### Action Click Attribution

The `decision_action_clicked` event includes:

```typescript
{
  sessionId: string,
  decisionType: string,
  actionType: 'visit' | 'demo' | 'compare' | 'save' | 'find-provider' | 'assessment',
  isPrimaryAction: boolean,
  resultId: string,
  targetSlug?: string,      // Product/resource slug
  isCommercial?: boolean,   // Affiliate/sponsored action
  durationBucket: string    // Time since decision started
}
```

### Implementation

Use the shared decision analytics module:

```typescript
import {
  createDecisionSession,
  trackDecisionStarted,
  trackDecisionResultShown,
  trackDecisionActionClicked,
  trackDecisionCompleted,
} from "@/domains/decision";

// Create session on journey start
const session = createDecisionSession("architect", "homepage");
trackDecisionStarted(session);

// Track result shown
session.primaryResultId = "simplepractice";
trackDecisionResultShown(session, "simplepractice", 3, "high");

// Track action click (links back to decision)
trackDecisionActionClicked(session, "visit", true, {
  targetSlug: "simplepractice",
  isCommercial: true,
});

// Track completion
trackDecisionCompleted(session, 5);
```

## 11. Implementation Notes

### Event Transmission

- Use existing Vercel Analytics + GA4 integration
- Events fire client-side
- No server-side event enrichment with session data

### Session ID Generation

- Generate via `generateSessionId()` from decision analytics
- Store in component state (React useState/context)
- Do not persist across browser sessions
- Do not associate with any user account

### Validation

Before transmitting any event:
1. Verify no prohibited fields are present
2. Verify all values match expected types
3. Apply bucketing to numeric values
4. Strip any unexpected properties

## 12. Denominator Definitions

For funnel analysis:

| Metric | Denominator | Definition |
|--------|-------------|------------|
| Journey completion rate | `decision_started` | % that reach `decision_completed` |
| Crisis detection rate | `decision_started` (patient) | % that trigger `crisis_signal_detected` |
| Result engagement rate | `decision_result_shown` | % that fire `decision_action_clicked` |
| Action conversion rate | `decision_result_shown` | % that click any action |
| Commercial action rate | `decision_action_clicked` | % where `isCommercial: true` |
| Primary action rate | `decision_action_clicked` | % where `isPrimaryAction: true` |
| Clarity improvement | `clarity_reported` submissions | Average `clarityAfter - clarityBefore` |

### Session-Based Funnel

Use `sessionId` to calculate:

```
decision_started    → 100% (baseline)
decision_result_shown → X%  (completion to result)
decision_action_clicked → Y% (result to action)
```

Filter by `decisionType` to compare patient vs clinician funnels.

---

*Document version: 0.2.0*
*Created: 2025-09-02*
*Updated: 2026-09-02 (Phase 6: Session context and attribution)*
