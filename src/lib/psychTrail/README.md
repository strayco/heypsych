# PsychTrails - Mental Health Treatment Simulator

An educational, Oregon Trail-style simulation engine for exploring mental health treatment paths. Built as a data-driven, turn-based simulation platform.

## Architecture

The system is built in three distinct layers:

### 1. Engine Layer (`src/lib/psychTrail/`)

Pure TypeScript simulation engine with **no UI dependencies**.

- **`types.ts`** - Core type definitions for scenarios, state, and mechanics
- **`engine.ts`** - Main simulation engine with turn-based logic
- **`rng.ts`** - Seeded random number generator for deterministic runs
- **`schemas.ts`** - Zod schemas for runtime validation
- **`scenarios/`** - JSON scenario files (content)
- **`validateScenarios.ts`** - Build-time validation tool

#### Engine Features

- ✅ Deterministic runs (seeded RNG)
- ✅ Discrete time steps (week-based)
- ✅ Random + conditional events (weighted probabilities)
- ✅ Choices with constraints (condition-based availability)
- ✅ Effects system (metrics, flags, endings)
- ✅ History logging (for replay/debug/share)
- ✅ Pure functions (no side effects)

### 2. UI Layer (`src/components/psychTrail/`)

Pure renderer components with **no simulation logic**.

- **`GameContainer.tsx`** - Main orchestrator (state management only)
- **`MetricsDisplay.tsx`** - Visual metric bars/meters
- **`NodeDisplay.tsx`** - Story text renderer
- **`ChoiceList.tsx`** - Interactive choice buttons
- **`EventLog.tsx`** - Event notifications
- **`Timeline.tsx`** - History visualization
- **`EndingDisplay.tsx`** - Ending screen

All components are presentation-only. The engine handles all logic.

### 3. Route Layer (`src/app/psychtrails/`)

Next.js pages that wire engine + UI together.

- **`page.tsx`** - Onboarding flow (life stage + lens selection)
- **`map/page.tsx`** - Tile-based map interface
- **`play/[tileId]/page.tsx`** - Individual scenario player

**Legacy routes** (`src/app/psych-trail/`) redirect to `/psychtrails` onboarding.

## Data Model

Scenarios are defined as JSON files with the following structure:

```typescript
{
  // Metadata
  id: string
  version: string
  name: string
  reviewedBy?: string
  updatedAt: string

  // Starting state
  startNodeId: string
  initialMetrics: { [key: string]: number }
  initialFlags: { [key: string]: boolean }

  // Content
  nodes: Node[]       // Story moments
  choices: Choice[]   // User decisions
  events: Event[]     // Random/conditional occurrences
  endings: Ending[]   // Terminal states
}
```

### Core Concepts

**Node** - A moment in the story where the user sees text and makes choices.

**Choice** - A decision the user can make, with:
- Conditions (when it's available)
- Effects (what happens when selected)
- Next node (where it leads)

**Event** - Something that can happen randomly or conditionally:
- Probability (0-1)
- Conditions (when it can trigger)
- Effects (what happens if it triggers)

**Effect** - A modification to state:
- `metric` - Change a numeric value (±)
- `flag` - Set a boolean flag
- `end` - Trigger an ending

**Condition** - A rule that evaluates against state:
- `flag` - Check boolean flag
- `metric` - Compare metric value
- `week` - Check current week
- `and`/`or`/`not` - Logical combinations

## Turn System

Each turn follows this flow:

```
1. User selects choice
   ↓
2. Apply choice effects
   ↓
3. Advance time (if choice.advancesTime !== false)
   ↓
4. Roll for random events (based on probabilities + conditions)
   ↓
5. Apply event effects
   ↓
6. Move to next node
   ↓
7. Update history log
   ↓
8. Render new state
```

## Creating Scenarios

### 1. Create JSON file

Add a new file to `src/lib/psychTrail/scenarios/`:

```json
{
  "id": "your-scenario-id",
  "version": "1.0.0",
  "name": "Your Scenario Name",
  "updatedAt": "2025-01-15T00:00:00Z",
  "startNodeId": "intro",
  "initialMetrics": {
    "mood": 50,
    "energy": 50
  },
  "initialFlags": {},
  "nodes": [...],
  "choices": [...],
  "events": [...],
  "endings": [...]
}
```

### 2. Validate scenario

Run the validation tool:

```bash
tsx src/lib/psychTrail/validateScenarios.ts
```

This checks for:
- ✅ Schema compliance (types, required fields)
- ✅ Missing node IDs
- ✅ Dead ends
- ✅ Unreachable nodes
- ✅ Invalid references

### 3. Import scenario

Add to `src/lib/psychTrail/index.ts`:

```typescript
import yourScenarioRaw from "./scenarios/your-scenario.json";

const yourScenario = ScenarioSchema.parse(yourScenarioRaw) as Scenario;

export const scenarios = {
  depressionTreatmentDemo,
  yourScenario, // Add here
};
```

### 4. Use in app

```typescript
import { scenarios } from "@/lib/psychTrail";
import { GameContainer } from "@/components/psychTrail";

<GameContainer scenario={scenarios.yourScenario} />
```

## Example Scenario

See [depression-treatment-demo.json](./scenarios/depression-treatment-demo.json) for a complete example with:
- Multiple treatment paths (therapy, medication, combined)
- Conditional choices (based on metrics/flags)
- Random events (good days, setbacks, breakthroughs)
- Multiple endings (success, partial, struggle)

## Guardrails

### Validation

- ✅ All scenarios validated with Zod at import time
- ✅ Build fails if scenarios have errors
- ✅ Warnings for potential issues (dead ends, unreachable nodes)

### Versioning

Every scenario must include:
- `version` - Semantic version (e.g., "1.0.0")
- `reviewedBy` - Who approved the content
- `updatedAt` - Last update timestamp (ISO 8601)

### Content Safety

While this is Oregon Trail-style, keep framing as:
- ✅ Educational simulation
- ✅ Fictional scenarios
- ✅ Not medical advice

Disclaimer is automatically shown in the UI.

## API Reference

### Engine

```typescript
import { PsychTrailEngine } from "@/lib/psychTrail";

const engine = new PsychTrailEngine(scenario, seed?);

// Create initial state
const state = engine.createInitialState(seed?);

// Get current node
const node = engine.getCurrentNode(state);

// Get available choices (filtered by conditions)
const choices = engine.getAvailableChoices(state);

// Process a turn
const result = engine.processTurn(state, { choiceId: "..." });
// Returns: { newState, triggeredEvents, choice }

// Get ending
const ending = engine.getEnding(endingId);
```

### Components

```typescript
import {
  GameContainer,
  MetricsDisplay,
  NodeDisplay,
  ChoiceList,
  EventLog,
  Timeline,
  EndingDisplay,
} from "@/components/psychTrail";

// Main game (handles everything)
<GameContainer scenario={scenario} />

// Or use individual components for custom layouts
<MetricsDisplay metrics={state.metrics} />
<NodeDisplay node={node} weekNumber={state.currentWeek} />
<ChoiceList
  choices={choices}
  onChoiceSelect={(id) => handleChoice(id)}
/>
```

## Testing

The engine is deterministic with seeded RNG, making it fully testable:

```typescript
const engine = new PsychTrailEngine(scenario, 12345); // Fixed seed
const state1 = engine.createInitialState(12345);
const state2 = engine.createInitialState(12345);

// Same seed = identical runs
expect(state1).toEqual(state2);
```

## Future Enhancements

Potential additions (not yet implemented):

- [ ] Save/load runs (state serialization)
- [ ] Replay system (from history log)
- [ ] Branching scenarios (scenario-to-scenario transitions)
- [ ] Analytics (track common paths, endings)
- [ ] Markdown rendering in text (currently plain text with \n\n)
- [ ] Character system (multiple perspectives)
- [ ] Resource management (time, money, etc.)

## File Structure

```
src/
├── lib/psychTrail/              # Engine layer
│   ├── types.ts                 # Type definitions
│   ├── engine.ts                # Simulation engine
│   ├── rng.ts                   # Seeded RNG
│   ├── schemas.ts               # Zod schemas
│   ├── validateScenarios.ts     # Validation tool
│   ├── index.ts                 # Public API
│   ├── README.md                # This file
│   └── scenarios/               # Scenario files
│       └── *.json
│
├── components/psychTrail/       # UI layer
│   ├── GameContainer.tsx        # Main orchestrator
│   ├── MetricsDisplay.tsx       # Metrics renderer
│   ├── NodeDisplay.tsx          # Story renderer
│   ├── ChoiceList.tsx           # Choice renderer
│   ├── EventLog.tsx             # Events renderer
│   ├── Timeline.tsx             # History renderer
│   ├── EndingDisplay.tsx        # Ending renderer
│   ├── onboarding/              # Onboarding flow components
│   ├── map/                     # Map interface components
│   └── index.ts                 # Exports
│
├── app/psychtrails/             # Route layer
│   ├── page.tsx                 # Onboarding flow
│   ├── map/page.tsx             # Tile-based map
│   └── play/[tileId]/page.tsx   # Scenario player
│
└── app/psych-trail/             # Legacy routes (redirects)
    └── [scenarioId]/page.tsx    # Redirects to /psychtrails
```

## License & Credits

Part of HeyPsych - Mental Health Treatment Information Platform

Educational simulation for learning purposes only. Not medical advice.
