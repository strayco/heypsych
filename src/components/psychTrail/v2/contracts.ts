import type { Pack, ScenarioV2, Challenge, MasteryTier, Grade, EndOfRunResult, ProgressState, PackProgress, ScenarioProgress, RewardGrant, Achievement, UnlockGrant, ObjectiveResult, RouteDetectionResult, MasteryProgress, RunScoreResult, InterpretationResult } from "@/lib/psychTrail/types-v2";

export interface HomeScreenProps {
  progress: { totalXP: number; rank: string; scenariosCompleted: number; routesDiscovered: number };
  featuredPack: PackCardProps | null;
  recentScenario: { id: string; title: string; bestScore: number; bestGrade: Grade; masteryTier: MasteryTier } | null;
  onSelectPack: (id: string) => void;
  onSelectScenario: (id: string) => void;
  onOpenAchievements: () => void;
  onOpenProgress: () => void;
}

export interface PackBrowserProps {
  packs: PackCardProps[];
  onSelectPack: (id: string) => void;
  onBack: () => void;
}

export interface PackCardProps {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  scenarioCount: number;
  completedCount: number;
  totalStars: number;
  maxStars: number;
  masteryTier: MasteryTier;
  unlocked: boolean;
  theme: { primaryColor: string; accentColor: string };
}

export interface PackDetailProps {
  pack: PackCardProps;
  scenarios: ScenarioCardProps[];
  packChallenges: { id: string; title: string; description: string; completed: boolean }[];
  onSelectScenario: (id: string) => void;
  onBack: () => void;
}

export interface ScenarioCardProps {
  id: string;
  title: string;
  summary: string;
  difficulty: string;
  estimatedMinutes: number;
  bestStars: 0 | 1 | 2 | 3;
  bestGrade: Grade | null;
  masteryTier: MasteryTier;
  unlocked: boolean;
}

// Simplified pre-run props - therapeutic focus, no gamification
export interface ScenarioPreRunProps {
  scenario: {
    id: string;
    title: string;
    summary: string;
    difficulty: string;
    estimatedMinutes: number;
    stuckMoment?: string;
    practiceAreas?: string[];
  };
  hasBeenPlayed?: boolean;
  onStartRun: () => void;
  onBack: () => void;
}

export interface RunScreenProps {
  scenarioTitle: string;
  challengeActive: boolean;
  currentStep: number;
  maxSteps: number;
  stepLabel: string;
  metrics: { key: string; label: string; value: number; max: number }[];
  nodeText: string;
  choices: RunChoiceProps[];
  resultText: string | null;
  onSelectChoice: (id: string) => void;
}

export interface RunChoiceProps {
  id: string;
  text: string;
  description: string;
  style: string;
  riskLevel: string;
  disabled: boolean;
}

// EndOfRunSummaryProps - simplified, therapeutic focus
// Note: Full interface is defined in EndOfRunSummary.tsx
export interface EndOfRunSummaryProps {
  // Ending narrative
  endingTitle: string;
  endingText: string;

  // Interpretation layer - therapeutic reflection
  interpretation?: InterpretationResult | null;

  // Supportive observations - derived from what happened
  observations?: string[];

  // Related scenario for continue flow
  relatedScenario?: {
    id: string;
    title: string;
    estimatedMinutes: number;
  } | null;

  // PMF signal
  scenarioId?: string;
  isFirstScenarioCompletion?: boolean;
  showUsefulnessSignal?: boolean;

  // Core actions
  onReplay: () => void;
  onBackToScenarios: () => void;
  onPlayRelated?: () => void;

  // Campus mode extensions
  onProceedToTransfer?: () => void;
  showTransferButton?: boolean;

  // Interpretation callback
  onCommitToRep?: (rep: string) => void;
}

export interface MasteryDashboardProps {
  scenarioTitle: string;
  tier: MasteryTier;
  bestRun: { score: number; grade: Grade; stars: number } | null;
  routes: { discovered: { id: string; name: string; description: string }[]; hidden: { hint: string | null }[]; percentage: number };
  objectives: { completed: { id: string; title: string }[]; remaining: { id: string; title: string }[] };
  challenges: { completed: { id: string; title: string }[]; remaining: { id: string; title: string }[] };
  nextTierRequirements: { description: string; met: boolean }[];
  onPlayAgain: () => void;
  onBack: () => void;
}

export interface AchievementsScreenProps {
  unlocked: { id: string; title: string; description: string; icon: string; category: string }[];
  locked: { id: string; title: string; description: string; icon: string; category: string; progress: string }[];
  onBack: () => void;
}

export interface ProgressScreenProps {
  global: { totalXP: number; rank: string; nextRank: string; xpToNext: number; totalRuns: number; scenariosCompleted: number; packsCompleted: number; routesDiscovered: number };
  recentActivity: { scenarioTitle: string; grade: Grade; stars: number; timestamp: number }[];
  onBack: () => void;
}
