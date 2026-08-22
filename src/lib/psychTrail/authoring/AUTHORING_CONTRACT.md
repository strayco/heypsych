# PsychTrails Scenario Authoring Contract

This document defines the permanent authoring standard for PsychTrails scenarios.

## Hard Rules

1. **One folder per scenario** - Each scenario lives in its own directory
2. **Modular source files inside that folder** - Human-editable JSON files split by concern
3. **One compiled runtime artifact out** - Single JSON file for the V2 runtime
4. **The modular folder is the human-edited source of truth** - Never edit compiled artifacts
5. **The compiled artifact is the only thing the deterministic runtime consumes** - No fallbacks
6. **Do not create new hand-authored monolithic scenario JSON files** - Use the modular structure
7. **Do not introduce per-scenario runtime code** - Keep runtime generic
8. **Do not leave ambiguous fallback paths** - One source model, one compiled path

## Clinical Usefulness Requirements

Every scenario must be built for **clinical usefulness**, not just entertainment. This means:

### Minimum Structural Requirements

| Requirement | Count | Notes |
|-------------|-------|-------|
| Primary stuck moment | 1 | Specific, targetable moment of difficulty |
| Primary mechanisms | 1–3 | From canonical mechanism taxonomy |
| Named routes | 3–7 | Distinct emotional/behavioral paths |
| Primary objectives | ≥3 | Clear achievable goals |
| Hidden routes/objectives | ≥1 | Discovery/mastery content |
| Recovery routes | ≥1 | Comeback after setback |
| Challenge variants | ≥2 | Meaningful replay modifiers |
| Transfer prompt per ending | All | Real-world next-step output |

### Canonical Mechanism Taxonomy (10 mechanisms)

All `primaryMechanisms` and `secondaryMechanisms` must use these IDs:

| Mechanism ID | Name | Description |
|--------------|------|-------------|
| `activation` | Activation | Starting action despite inertia or resistance |
| `persistence` | Persistence | Continuing effort despite difficulty or discomfort |
| `recovery` | Recovery | Returning to action after setback, avoidance, or failure |
| `interpretation` | Interpretation | Reading ambiguous signals accurately without distortion |
| `self_compassion` | Self-Compassion | Responding to difficulty with kindness instead of attack |
| `directness` | Directness | Communicating or acting clearly instead of indirectly |
| `distress_tolerance` | Distress Tolerance | Staying present with discomfort without escaping |
| `flexibility` | Flexibility | Adjusting approach when current strategy isn't working |
| `support_seeking` | Support-Seeking | Asking for or accepting help when struggling |
| `threshold_lowering` | Threshold-Lowering | Finding smaller workable steps instead of all-or-nothing |

### Canonical Pattern Taxonomy (15 patterns)

All `patternTags` and `patternOutcomes` must use these IDs:

| Pattern ID | Valence | Description |
|------------|---------|-------------|
| `avoidance_at_threshold` | negative | Exited or collapsed at the last step before goal |
| `premature_exit` | negative | Left scenario early without attempting main path |
| `overreach_collapse` | negative | Pushed too hard, then crashed |
| `interpretation_distortion` | negative | Chose mind-reading or catastrophizing interpretations |
| `self_attack_spiral` | negative | Engaged self-critical voice, worsened outcome |
| `recovery_success` | positive | Returned to action after setback |
| `micro_progress` | positive | Completed via small incremental steps |
| `perfectionism_trap` | negative | All-or-nothing thinking blocked partial progress |
| `support_utilized` | positive | Asked for or accepted help |
| `distress_tolerated` | positive | Stayed through uncomfortable moment without escaping |
| `direct_action` | positive | Took straightforward approach instead of indirect |
| `compassion_applied` | positive | Used self-compassion to enable action |
| `threshold_lowered` | positive | Found and used minimum viable step |
| `safety_behavior` | negative | Used phone, avoidance, or other escape mechanism |
| `grounded_interpretation` | positive | Interpreted ambiguous moment accurately |

### Stuck Moment Domains

The `stuckMoment.domain` must be one of:

`depression`, `anxiety`, `social-anxiety`, `adhd`, `shame`, `conflict`, `avoidance`, `perfectionism`, `support-seeking`, `activation`, `recovery`, `boundaries`

## Directory Structure

```
src/lib/psychTrail/
├── authoring/                          # Authoring system
│   ├── scenarios/                      # MODULAR SOURCE (human-edited)
│   │   ├── _template/                  # Blueprint for new scenarios
│   │   │   ├── metadata.json
│   │   │   ├── state.json
│   │   │   ├── nodes.json
│   │   │   ├── choices.json
│   │   │   ├── endings.json
│   │   │   ├── objectives.json
│   │   │   ├── routes.json
│   │   │   ├── challenges.json
│   │   │   ├── scoring.json
│   │   │   ├── hints.json
│   │   │   └── events.json
│   │   ├── dining-hall/                # Example: Dining Hall scenario source
│   │   │   ├── metadata.json
│   │   │   ├── state.json
│   │   │   ├── nodes.json
│   │   │   ├── choices.json
│   │   │   ├── endings.json
│   │   │   ├── objectives.json
│   │   │   ├── routes.json
│   │   │   ├── challenges.json
│   │   │   ├── scoring.json
│   │   │   ├── hints.json
│   │   │   └── events.json
│   │   └── <new-scenario>/             # Each new scenario gets its own folder
│   ├── types.ts                        # Authoring type definitions
│   ├── validator.ts                    # Source validation
│   ├── compiler.ts                     # Source → Runtime artifact
│   ├── loader.ts                       # File loading utilities
│   ├── build.ts                        # CLI build script
│   └── index.ts                        # Public exports
├── scenarios-compiled/                 # COMPILED ARTIFACTS (runtime-only)
│   ├── dining-hall.json                # Compiled Dining Hall
│   └── <scenario-id>.json              # Each compiled scenario
├── scenario-registry.ts                # Runtime loader (compiled-only)
├── engine-v2.ts                        # Deterministic runtime
└── types-v2.ts                         # Runtime type definitions
```

## Per-Scenario Folder Structure

Every scenario folder must contain these files:

### Required Files

| File | Owns | Description |
|------|------|-------------|
| `metadata.json` | Identity | ID, title, version, tags, difficulty, category |
| `state.json` | Configuration | Start node, initial metrics/flags, unlock requirements, UI config |
| `nodes.json` | Narrative | All narrative nodes and their choice references |
| `choices.json` | Interaction | All player choices and their effects |
| `endings.json` | Outcomes | All possible endings and their rewards |
| `objectives.json` | Goals | Primary, challenge, and hidden objectives |
| `routes.json` | Paths | Named routes through the scenario |
| `challenges.json` | Modifiers | Replay challenge modes |
| `scoring.json` | Points | Category weights and grade thresholds |
| `hints.json` | LLM/Coach | Context, coaching focus, debrief prompts |

### Optional Files

| File | Owns | Description |
|------|------|-------------|
| `events.json` | Random Events | Optional random events during play |

## File Ownership Rules

### What Each File Owns (Do Not Duplicate Elsewhere)

- **metadata.json**: `id`, `version`, `title`, `summary`, `tags`, `difficulty`, `estimatedMinutes`, `icon`, `category`, `packIds`, `createdAt`, `updatedAt`, **`stuckMoment`**, **`primaryMechanisms`**, **`secondaryMechanisms`**, **`realWorldAnalogs`**
- **state.json**: `startNodeId`, `initialMetrics`, `initialFlags`, `unlockRequirements`, `timeConfig`, `uiConfig`
- **nodes.json**: All `NodeSource` definitions
- **choices.json**: All `ChoiceSource` definitions (including `mechanismEffects`, `patternTags`)
- **endings.json**: All `EndingSource` definitions (including `mechanismOutcomes`, `patternOutcomes`, **`transferPrompts`**, `reflectionPrompts`, `smallestBetterMove`)
- **objectives.json**: All `ObjectiveSource` definitions
- **routes.json**: All `RouteSource` definitions (including `isRecovery`, `mechanismSignature`, `associatedPatterns`, `transferMapping`)
- **challenges.json**: All `ChallengeSource` definitions (including `targetMechanisms`, `targetPatterns`, `transferFocus`)
- **scoring.json**: All scoring configuration
- **hints.json**: LLM context, coaching focus, debrief prompts, skill signals, **`mechanismCoaching`**, **`patternCoaching`**

### What Must Never Be Duplicated

1. **IDs** - Node, choice, ending, objective, route, challenge IDs must be unique within a scenario
2. **Metric definitions** - Defined only in `state.json` `uiConfig.metrics`
3. **Scoring weights** - Defined only in `scoring.json`
4. **LLM context** - Defined only in `hints.json`

## Build Process

### Creating a New Scenario

```bash
# 1. Copy template
cp -r src/lib/psychTrail/authoring/scenarios/_template src/lib/psychTrail/authoring/scenarios/my-scenario

# 2. Edit modular source files
# Edit each JSON file in the my-scenario folder

# 3. Validate
npx tsx src/lib/psychTrail/authoring/build.ts --validate

# 4. Build
npx tsx src/lib/psychTrail/authoring/build.ts my-scenario

# 5. Compiled artifact appears at:
# src/lib/psychTrail/scenarios-compiled/my-scenario.json
```

### Building All Scenarios

```bash
npx tsx src/lib/psychTrail/authoring/build.ts --all
```

### Validation Only

```bash
npx tsx src/lib/psychTrail/authoring/build.ts --validate
```

## Runtime Loading

The runtime loads scenarios from compiled artifacts only:

```typescript
import { loadScenario } from "./scenario-registry";

const scenario = await loadScenario("dining_hall");
// Loads from scenarios-compiled/dining-hall.json
// Throws ScenarioNotFoundError if missing
```

### No Fallbacks

- No fallback to legacy scenario sources
- No fallback to monolithic JSON files
- Missing compiled artifacts fail loudly with `ScenarioNotFoundError`

## Validation Rules

The compiler enforces:

### Structural Validation
1. **Unique IDs** - No duplicate node, choice, ending, objective, route, challenge IDs
2. **Valid References** - All `nextNodeId`, `endingId`, `objectiveId`, `routeId` must exist
3. **Reachable Nodes** - All nodes must be reachable from `startNodeId`
4. **Complete Paths** - Every choice must lead somewhere (nextNodeId or end effect)
5. **Valid Metrics** - All metric references must be declared in `uiConfig.metrics`
6. **Valid Score Categories** - All `scoreEffects` must use valid categories
7. **Required Files** - All 10 required files must exist in scenario folder

### Clinical Validation
8. **Stuck Moment Required** - `metadata.stuckMoment` must exist with all fields
9. **Primary Mechanisms Required** - 1–3 mechanisms from canonical taxonomy
10. **Real-World Analogs Required** - At least 1 real-world analog
11. **Route Count** - Minimum 3 named routes
12. **Hidden Routes** - At least 1 hidden route
13. **Recovery Routes** - At least 1 route with `isRecovery: true`
14. **Primary Objectives** - At least 3 primary objectives
15. **Hidden Objectives** - At least 1 hidden objective
16. **Challenges** - At least 2 challenge variants
17. **Transfer Prompts** - Every ending must have `transferPrompts.default`
18. **Valid Mechanisms** - All mechanism IDs must be from canonical taxonomy
19. **Valid Patterns** - All pattern IDs must be from canonical taxonomy

## Guardrails Enforced

| Guardrail | Enforcement |
|-----------|-------------|
| One folder per scenario | `_template` folder as blueprint, build script scans directories |
| Modular source only for authoring | Compiler only accepts `ScenarioSource` from modular files |
| One compiled artifact out | `build.ts` outputs single JSON per scenario |
| Deterministic runtime consumes compiled only | `scenario-registry.ts` loads only from `scenarios-compiled/` |
| Missing artifacts fail loudly | `ScenarioNotFoundError` thrown, no silent failures |
| No legacy fallback | No fallback code paths in registry |

## Non-Negotiables

1. **Never edit compiled artifacts** - They are generated output
2. **Never create monolithic scenario JSON as source** - Use modular structure
3. **Never add fallback loading paths** - One source, one compiled path
4. **Never add per-scenario runtime code** - Keep engine generic
5. **Always validate before committing** - Run `--validate` to catch errors early
6. **Always rebuild after source changes** - Run build script after editing

## Clinical Authoring Guidelines

### Transfer Prompts
- Must be specific and actionable (not vague advice)
- Must be achievable within 24 hours
- Maximum 2 sentences / 280 characters
- Should vary by route/pattern when appropriate

### Mechanism Effects
- Add to choices that demonstrate or train a mechanism
- Use positive delta for beneficial actions, negative for counterproductive
- Connect to scenario's `primaryMechanisms` and `secondaryMechanisms`

### Pattern Tags
- Tag choices that contribute to behavioral patterns
- Use for both positive and negative patterns
- Enable cross-run pattern detection

### Recovery Routes
- Every scenario must have at least 1 recovery route
- Mark with `isRecovery: true`
- Should demonstrate the `recovery` mechanism
- Should enable the `recovery_success` pattern

### Smallest Better Move
- Add to negative/weak endings
- Reference an actual choice in the scenario
- Describe the smallest change that would have improved outcome

### Mechanism Coaching (hints.json)
- Provide `whenStrong`, `whenWeak`, and `practiceHint` for each primary mechanism
- Keep tone practical, not preachy
- Focus on what to do next, not what went wrong

### Pattern Coaching (hints.json)
- Provide `detected` and `nextStep` for relevant patterns
- `detected` should name what happened without judgment
- `nextStep` should be one concrete action

## Scenario Blueprint Standard

All future scenarios must follow this blueprint:

1. **Define one clear stuck moment** - Specific, targetable, emotionally real
2. **Choose 1–3 primary mechanisms** - What psychological skills does this train?
3. **Design 3–7 distinct routes** - Different emotional/behavioral paths through
4. **Include recovery routes** - At least 1 path that demonstrates coming back from setback
5. **Include hidden discovery** - At least 1 hidden route or objective
6. **Create transfer prompts** - Every ending points to real-world action
7. **Add mechanism coaching** - Help users understand what worked/didn't work
8. **Add pattern coaching** - Help users recognize recurring behaviors
9. **Make replay valuable** - Challenges, routes, and objectives that reward repetition
10. **Keep it emotionally real** - No cheesy inspiration, no moralizing, no "you fixed it"
