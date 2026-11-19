# Patient Pilot Contract: Find My Support Path

> Phase 0A deliverable for the HeyPsych Decision Platform.
> Classification: Draft — requires product and clinical authority approval.

## 1. Pilot Definition

**Name:** Find My Support Path

**Audience:** Patients, family members, or caregivers seeking mental health support

**Journey Question:** "What kind of support should I look for?"

**Entry Points:**
- Homepage patient gateway ("Find Therapy & Support")
- `/find-support` (new decision route)
- `/tools/find-support` (existing hub, becomes fallback)

**Type:** Non-diagnostic care-path decision (NOT a diagnostic tool, NOT a treatment prescriber)

## 2. Allowed Inputs

### Primary Inputs

| Field | Type | Purpose |
|-------|------|---------|
| `urgencyCheck` | enum | immediate-crisis, struggling-now, planning-ahead |
| `primaryConcerns` | array | Selected from symptom categories (max 3) |
| `supportGoals` | array | What they hope to achieve |
| `priorSupport` | enum | none, tried-apps, tried-therapy, currently-in-care |
| `practicalConstraints` | object | insurance, location, preferences |

### Symptom Categories (from existing domain)

- mood-motivation
- worry-fear
- sleep
- attention-memory
- thoughts-perceptions
- trauma-stress
- eating-body-image
- energy-physical
- behavior-impulses
- relationships-social

### Optional Inputs

| Field | Type | Purpose |
|-------|------|---------|
| `assessmentResults` | object | Validated screener scores (clinician-approved list only) |
| `ageGroup` | enum | child, adolescent, adult, older-adult |
| `preferredModality` | enum | in-person, telehealth, either |

### Prohibited Inputs

- Free-text mental health narratives (by default)
- Diagnosis self-report for routing
- Insurance credentials or policy numbers
- Identifiable health information beyond session scope

## 3. Ordered Questions

### Phase 1: Safety Check (ALWAYS FIRST)

1. **Urgency Screen** — "How are you feeling right now?"
   - "I'm in crisis or having thoughts of hurting myself" → **IMMEDIATE CRISIS PATH**
   - "I'm struggling and need help soon"
   - "I'm planning ahead / exploring options"

### Phase 2: Understanding Concerns

2. **Primary Concerns** — "What's been affecting you most? (Select up to 3)"
   - Displays symptom categories with examples
   - "I'm not sure" → branches to symptom explorer

3. **Duration/Impact** — "How long has this been affecting your daily life?"
   - Less than 2 weeks
   - 2 weeks to 3 months
   - More than 3 months
   - On and off for a long time

### Phase 3: Goals and Context

4. **Support Goals** — "What are you hoping to get from support?"
   - Understand what I'm experiencing
   - Learn coping strategies
   - Talk to someone regularly
   - Get professional diagnosis/evaluation
   - Explore medication options
   - Crisis or safety support

5. **Prior Experience** — "Have you tried mental health support before?"
   - No, this is new for me
   - I've used apps or self-help
   - I've seen a therapist or counselor
   - I'm currently in care and need something different

### Phase 4: Practical Factors (Optional)

6. **Insurance** — "Do you have health insurance you'd like to use?"
   - Yes, I want to use insurance
   - No, I'll pay out of pocket
   - I'm not sure / prefer not to say

7. **Modality** — "How would you prefer to connect?"
   - In person
   - Video/telehealth
   - Either works

## 4. Output Types

### Primary Output: Support Path Recommendation

```typescript
interface SupportPathResult {
  primaryPath: SupportPath;
  alternatives: SupportPath[];
  urgentResources?: CrisisResource[];  // Always present if any safety signal
  confidence: ConfidenceLevel;
  missingInfo: string[];
  nextActions: NextAction[];
  disclaimer: string;
  versions: {
    definition: string;
    evaluator: string;
  };
}

interface SupportPath {
  id: string;
  name: string;                        // e.g., "Talk Therapy", "Psychiatric Evaluation"
  description: string;                 // What this path involves
  whyThisFits: string[];              // Reasons based on inputs
  considerations: string[];            // Things to think about
  whenBetterFit: string;              // When an alternative might be better
  typicalFirst: string;               // What to expect first
}

type ConfidenceLevel = 'clear-path' | 'reasonable-options' | 'needs-exploration';
```

### Support Paths (Clinician-Defined)

| Path ID | Name | Description |
|---------|------|-------------|
| `crisis-support` | Crisis Support | Immediate safety resources and crisis intervention |
| `therapy-counseling` | Talk Therapy | Regular sessions with therapist/counselor |
| `psychiatric-eval` | Psychiatric Evaluation | Assessment by psychiatrist, may include medication |
| `integrated-care` | Integrated Care | Combined therapy and psychiatric services |
| `peer-support` | Peer Support | Support groups and peer communities |
| `digital-tools` | Digital Tools | Apps and self-guided programs |
| `primary-care` | Start with Primary Care | Begin with your regular doctor |

## 5. Prohibited Claims

The pilot MUST NOT:

- Diagnose any mental health condition
- State that user "has" or "likely has" any condition
- Prescribe or recommend specific medications
- Guarantee that any path will be effective
- Claim insurance will cover any specific service
- Provide therapy, counseling, or clinical intervention
- Use assessment scores alone to determine care level
- State provider availability, waitlists, or appointment access
- Imply that completing the journey replaces professional evaluation

### Required Framing

- "Based on what you've shared, you might consider..."
- "Many people with similar concerns find it helpful to..."
- "A reasonable next step could be..."
- "This is not a diagnosis — a professional can help you understand more"

## 6. Safety Overrides

### Immediate Crisis Path

**Triggers:**
- User selects "I'm in crisis or having thoughts of hurting myself"
- Safety keywords detected: suicide, self-harm, overdose, "voices telling me to", "harm others"
- Assessment alert flag triggered (when assessments are enabled)

**Behavior:**
1. IMMEDIATELY display crisis resources (988, Crisis Text Line)
2. Skip remaining questions
3. Do NOT continue to recommendation engine
4. Offer: "When you're ready, you can return to explore ongoing support options"

**Crisis Resources (hardcoded, always available):**
```typescript
const CRISIS_RESOURCES = [
  { name: "988 Suicide & Crisis Lifeline", phone: "988", available: "24/7" },
  { name: "Crisis Text Line", text: "HOME to 741741", available: "24/7" },
  { name: "SAMHSA National Helpline", phone: "1-800-662-4357", available: "24/7" }
];
```

### Safety Keyword Detection

Uses existing `checkForSafetyKeywords()` from symptoms domain:
- Runs on any free-text input (if enabled)
- Client-side only (no server transmission)
- Triggers crisis banner display

### Crisis Independence

Crisis resources MUST remain accessible even if:
- The decision engine fails
- JavaScript fails to load
- The user navigates away and returns
- Any feature flag is disabled

## 7. Hard Eligibility Rules

| Rule | Condition | Result |
|------|-----------|--------|
| Immediate Crisis | `urgencyCheck === 'immediate-crisis'` | Crisis path only |
| Safety Keywords | `checkForSafetyKeywords() === true` | Crisis path + continue option |
| Medication Interest | `goals.includes('explore-medication')` | Must include psychiatric-eval path |
| Currently in Crisis Care | `priorSupport === 'crisis-care'` | Prioritize continuity guidance |

**Unknown handling:** If any input is skipped or unknown, the evaluator provides broader recommendations with lower confidence, never narrower.

## 8. Uncertainty Behavior

### Confidence Levels

| Level | Display | Meaning |
|-------|---------|---------|
| `clear-path` | "Based on what you've shared, this seems like a good fit" | Strong signal alignment |
| `reasonable-options` | "Here are some reasonable options to consider" | Multiple valid paths |
| `needs-exploration` | "Let's explore what might work for you" | Insufficient information |

### Missing Information Handling

When key inputs are skipped:
- Show all applicable paths without ranking
- Display: "To give you more specific guidance, it would help to know about [X]"
- Allow user to continue without answering

### "Not Sure" Handling

When user selects "I'm not sure" for concerns:
- Branch to symptom category explorer
- Use existing symptom search with category browsing
- Allow return to main flow with selections

## 9. Evidence Requirements

### Path Definitions

Each support path requires:
- Clinician-authored description
- Clinician-approved "why this fits" templates
- Clinician-approved "considerations" list
- Reviewed by clinical authority before launch

### Assessment Integration (Future)

Before any assessment influences routing:
- [ ] Assessment scoring contract audited
- [ ] Alert behavior tested with golden cases
- [ ] Clinician approval for routing rules
- [ ] No score-only routing (score + other factors only)

**Current state:** Assessments are informational only. They do NOT affect path recommendations until Phase 0B audit completes.

## 10. Next Actions

After completing a recommendation:

| Action | Destination | Type |
|--------|-------------|------|
| "Find a therapist near me" | `/psychiatrists` (with filters) | Navigation |
| "Explore therapy apps" | `/tools/find-support` filtered | Navigation |
| "Take a self-assessment" | `/resources?category=assessments` | Navigation |
| "Learn about [condition]" | `/conditions/{slug}` | Navigation |
| "Crisis resources" | Crisis banner (always visible) | In-page |
| "Start over" | Reset journey | Navigation |

**No direct commercial CTAs in patient journey output.** Commercial relationships appear only on destination pages with proper disclosure.

## 11. Owner and Review

| Role | Owner | Status |
|------|-------|--------|
| Product Owner | **[REQUIRES DECISION]** | Unassigned |
| Clinical Reviewer | **[REQUIRES DECISION]** | Unassigned — MANDATORY |
| Editorial Owner | **[REQUIRES DECISION]** | Unassigned |
| Privacy/Analytics Owner | **[REQUIRES DECISION]** | Unassigned |

### Clinical Review Requirements

- All support path definitions
- All "why this fits" templates
- All routing rules
- Safety override behavior
- Crisis resource accuracy
- Prohibited claims list

### Review Expiry

- Pilot contract: Clinical review every 6 months
- Crisis resources: Verify quarterly (phone numbers, availability)
- Path definitions: Review on any clinical feedback

## 12. Privacy-Safe Events

Events use session identifiers only, no health content:

```typescript
// Session
support_journey_started: { source: 'homepage' | 'nav' | 'direct' }

// Progress (no answer content)
urgency_check_completed: { branch: 'crisis' | 'struggling' | 'planning' }
concerns_selected: { count: number, usedNotSure: boolean }
journey_step_completed: { step: string }

// Outcome
support_path_shown: {
  pathId: string,
  alternativeCount: number,
  confidence: 'clear' | 'reasonable' | 'exploration',
}

// Actions
next_action_clicked: { actionType: string, pathId: string }
journey_completed: { totalSteps: number, pathSelected: string }
journey_abandoned: { lastStep: string }

// Crisis (aggregate only)
crisis_resources_shown: { trigger: 'selection' | 'keyword' | 'assessment' }
```

**Absolutely prohibited in events:**
- Symptom selections or descriptions
- Assessment answers or scores
- Free-text input of any kind
- Concern category selections (use count only)
- Any content that could identify health status

## 13. Rollback Gates

### Launch Gate

- [ ] All golden test cases pass (including adversarial)
- [ ] Clinical reviewer has approved all path definitions
- [ ] Crisis path works independently of main evaluator
- [ ] Safety keyword detection tested
- [ ] Mobile and desktop journeys pass manual QA
- [ ] Keyboard and screen-reader navigation complete
- [ ] No diagnostic or prescriptive language in UI
- [ ] Analytics events contain no health content (verified)
- [ ] Session pages have `noindex` meta tag
- [ ] Feature flag `patient-support-journey` controls exposure

### Pause Triggers

- Any report of diagnostic language in output
- Crisis path fails to display when triggered
- Safety keywords not detected
- Analytics event contains health content
- Clinical reviewer concern about any output

### Rollback Procedure

1. Disable `patient-support-journey` feature flag
2. Patient gateway routes to `/tools/find-support` (existing hub)
3. All in-progress sessions show: "This feature is temporarily unavailable. Here are resources that can help."
4. Crisis resources remain accessible on all pages

## 14. Golden Test Cases

### Case 1: Immediate Crisis

**Input:**
```yaml
urgencyCheck: immediate-crisis
```

**Expected:**
- Immediately shows 988, Crisis Text Line, SAMHSA
- Does NOT continue to concerns question
- Shows "When you're ready, explore ongoing support"
- Event: `crisis_resources_shown: { trigger: 'selection' }`

### Case 2: Safety Keyword Detection

**Input:**
```yaml
urgencyCheck: struggling-now
primaryConcerns: [mood-motivation]
# User enters free text containing "suicide"
```

**Expected:**
- Crisis banner appears immediately
- Journey can continue after acknowledgment
- Crisis resources remain visible throughout
- Event: `crisis_resources_shown: { trigger: 'keyword' }`

### Case 3: Therapy-Seeking Adult

**Input:**
```yaml
urgencyCheck: planning-ahead
primaryConcerns: [worry-fear, mood-motivation]
duration: more-than-3-months
goals: [talk-to-someone-regularly, learn-coping-strategies]
priorSupport: tried-apps
insurance: yes-use-insurance
modality: either
```

**Expected:**
- Primary path: `therapy-counseling`
- Alternatives: `integrated-care`, `digital-tools`
- Confidence: `clear-path`
- Next actions include "Find a therapist"
- No crisis resources in primary display (no signal)

### Case 4: Medication Interest

**Input:**
```yaml
urgencyCheck: struggling-now
primaryConcerns: [mood-motivation, sleep]
duration: 2-weeks-to-3-months
goals: [explore-medication-options]
priorSupport: tried-therapy
```

**Expected:**
- Primary path: `psychiatric-eval`
- Alternatives: `integrated-care`, `primary-care`
- Includes consideration: "A psychiatrist can discuss whether medication might help"
- Does NOT guarantee medication will be prescribed

### Case 5: Minimal Input

**Input:**
```yaml
urgencyCheck: planning-ahead
primaryConcerns: []  # skipped
```

**Expected:**
- Shows all non-crisis paths without ranking
- Confidence: `needs-exploration`
- Message: "To give you more specific guidance..."
- Offers symptom explorer branch

### Case 6: Child/Adolescent (if age provided)

**Input:**
```yaml
urgencyCheck: planning-ahead
ageGroup: child
primaryConcerns: [attention-memory]
goals: [professional-evaluation]
```

**Expected:**
- Paths appropriate for minors (family involvement mentioned)
- Consideration: "For children, care often involves family participation"
- Next action includes pediatric/family resources if available

---

## Appendix A: Decisions Requiring Authority

The following require product and clinical authority before launch:

1. **Clinical Reviewer Assignment** — Who approves path definitions and routing rules? **MANDATORY**
2. **Product Owner Assignment** — Who approves pilot changes?
3. **Launch Jurisdiction** — US-only or international? (affects crisis resources)
4. **Assessment Integration Timeline** — When can assessments influence routing?
5. **Free-Text Input** — Allow optional "tell us more" or prohibit entirely?
6. **Provider Shortlist** — Can we recommend specific providers? (requires verified data)
7. **Age-Specific Paths** — Separate paths for children/adolescents?

**Recommended defaults (for non-production development):**
- US-only pilot (988 and US crisis resources)
- No assessment routing until Phase 0B audit
- No free-text input by default
- No provider shortlists (link to search only)
- Single path set with age-appropriate considerations as notes

---

## Appendix B: Crisis Resource Verification

| Resource | Phone/Text | Last Verified | Next Review |
|----------|------------|---------------|-------------|
| 988 Suicide & Crisis Lifeline | Call, text or chat 988, 24/7; veterans press 1 | 2026-11-19 (DoD/VA/Health.mil publications) | Feb 2027 |
| Crisis Text Line | Text HOME to 741741, 24/7 | 2026-11-19 (crisistextline.org materials) | Feb 2027 |
| SAMHSA National Helpline | 1-800-662-4357 (HELP), free, confidential, 24/7 | 2026-11-19 (samhsa.gov/find-help/helplines/national-helpline) | Feb 2027 |

The site does not mention the 988 "press 3" LGBTQ+ youth option, which ended
in July 2025. Re-check all three each quarter.

International resources require jurisdiction decision before inclusion.

---

*Document version: 0.1.0-draft*
*Created: 2025-09-02*
*Status: Requires clinical and product authority approval*

---

## 12. Shipped journey and Your Path (2026-11-18)

The evaluator in `src/domains/patient-support` was not reachable from any page
before this date: `/find-support?need=support` showed three static links to
retired routes. It is now the journey at that URL
(`src/components/path/NextStepJourney.tsx`), behind `NEXT_PUBLIC_PATH_WORKSPACE`
(default on; off restores the three links, now pointed at live routes).

Departures from §3, each needing clinical sign-off:

| Contract | Shipped | Why |
|---|---|---|
| Goal "Crisis or safety support" | Not offered | Crisis is handled by the urgency question, which always comes first and stops the journey. A second crisis entry mid-journey duplicated it. |
| Q7 Modality | Not asked | The evaluator does not read `modalityPreference`; Phase 1 rule: ask only questions that affect output. |
| "I'm not sure" → symptom explorer | Continues with no concerns (broader result, per §8) and offers a link to `/symptoms` | Leaving the journey mid-way lost answers. Symptoms noted on `/symptoms` pre-fill this step next time. |

Pre-filling (`src/domains/path/journey.ts`): concern categories and duration
may be pre-selected from the visitor's own "I've noticed this" notes or from
their last kept answers. Every pre-selection is labelled on screen and
editable. The urgency question is never pre-filled.

Evaluator change: next-action `href`s only (retired routes → live pages);
selection logic untouched; `EVALUATOR_VERSION` 1.0.0 → 1.1.0. Golden tests
pass unchanged.

Appointment brief question templates (`src/domains/path/questions.ts`,
`QUESTIONS_VERSION` 1.0.0) are patient-facing clinical wording and require
review by the clinical owner before launch.

### 12.1 Breakthrough release (2026-11-19): one live board

The non-safety questions (§3 phases 2 to 4) are now shown together on one
board, answerable in any order, with the evaluator's result recomputed on
every change (`NextStepJourney.tsx`). Phase 1 (urgency) is unchanged: asked
first, alone, never pre-filled; "in crisis" shows crisis help only.

New, needing clinical sign-off:

- **"What would change it"** (`src/domains/path/what-if.ts`): the evaluator
  re-run on single-answer variations (goals, prior support, duration; never
  urgency), listing those that lead to a different path. It explains existing
  rules and adds none. Variations can never yield the crisis path.
- **"Changed from X because …"**: shown when an edit moves the path.
- **Confidence meter**: three segments mapped one-to-one from the evaluator's
  `confidence` value; no numeric score.
- **Condition and treatment pages show "Connects to your path"**: the
  visitor's noted symptoms that the condition guide describes (symptom
  registry relationships) and saved treatments used for it. Listed, never
  counted or ranked across conditions.

### 12.2 Final launch pass (2026-11-19)

No change to the evaluator, the urgency gate, crisis handling or routing.
New or changed patient-facing wording, each needing clinical sign-off:

- **Find support entry** (`SupportEntry.tsx`): "I'm looking for treatment or
  support" is shown first and larger, described as "One safety question, then
  a next step that updates as you answer. About a minute. Your answers stay on
  this device." (The recommended path id is still reported by the existing
  `support_path_shown` event; answers are not.)
- **Kept next step remembers why** (`NextStepJourney.tsx`, `PathMap.tsx`):
  "This matches the step you kept." / "You kept X before. Your answers now
  point here." / button "Update my kept step to Y"; the map shows the history
  of kept steps with the "changed because" reason recorded at the time.
- **Compare what you're considering** (`PathMap.tsx`): saved treatments side
  by side — kind, boxed warning, onset/course, three most common side effects,
  monitoring, controlled substance, number of brief questions. Facts come from
  the reviewed records only. A missing boxed-warning or controlled-substance
  field reads "Not listed in our guide. Check the medication label." and is
  never shown as "none" (`src/domains/path/safety-cells.ts`).
- **Data finding for the clinical owner:** 102 medication records have no
  boxed-warning text, including drugs whose US labels carry one (lithium,
  methylphenidate, mixed amphetamine salts, venlafaxine, trazodone, valproate,
  quetiapine XR, long-acting risperidone/olanzapine/paliperidone, methadone).
  Their treatment pages show no "Know first" boxed-warning tile. Controlled-
  substance data is missing for e.g. methylphenidate and amphetamine salts.

Live updates (Admin) cannot change any of the above: editable copy is limited
to the homepage subtitle and Practice Architect banner text, and flags and
experiments cover clinician tooling and presentation only.

### 12.3 Launch authorization (2026-11-19)

The founder confirmed in the launch session that the shipped patient
guidance is covered by the clinical review of HeyPsych's existing medical
content and authorized it for launch. That covers the evaluator's routing
recommendations, "what would change it" / "changed because", and the
appointment-brief question templates (§12, §12.1).

The rest of §12.2 is presentation of already-reviewed facts or interface
wording, not new clinical guidance:
- the comparison table shows reviewed record content;
- "Not listed in our guide. Check the medication label." is a
  missing-data notice;
- the Find support and kept-step text describes the interface.

Analytics: `hadCrisisSignal` was removed from `support_path_shown`, and the
event is not sent when the path shown is crisis support.

