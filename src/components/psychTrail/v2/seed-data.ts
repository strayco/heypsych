import type { HomeScreenProps, PackBrowserProps, PackCardProps, PackDetailProps, ScenarioCardProps, ScenarioPreRunProps, RunScreenProps, EndOfRunSummaryProps, MasteryDashboardProps, AchievementsScreenProps, ProgressScreenProps } from "./contracts";

export const SEED_PACK_CARD: PackCardProps = {
  id: "social-anxiety-fundamentals",
  title: "Social Anxiety Fundamentals",
  description: "Master the basics of facing social anxiety",
  difficulty: "beginner",
  scenarioCount: 1,
  completedCount: 0,
  totalStars: 0,
  maxStars: 3,
  masteryTier: "none",
  unlocked: true,
  theme: { primaryColor: "#3b82f6", accentColor: "#60a5fa" },
};

export const SEED_SCENARIO_CARD: ScenarioCardProps = {
  id: "dining_hall",
  title: "Dining Hall",
  summary: "Practice low-stakes social exposure in a crowded dining hall",
  difficulty: "beginner",
  estimatedMinutes: 8,
  bestStars: 0,
  bestGrade: null,
  masteryTier: "none",
  unlocked: true,
};

export const SEED_HOME_SCREEN: HomeScreenProps = {
  progress: { totalXP: 0, rank: "novice", scenariosCompleted: 0, routesDiscovered: 0 },
  featuredPack: SEED_PACK_CARD,
  recentScenario: null,
  onSelectPack: () => {},
  onSelectScenario: () => {},
  onOpenAchievements: () => {},
  onOpenProgress: () => {},
};

export const SEED_PACK_BROWSER: PackBrowserProps = {
  packs: [SEED_PACK_CARD],
  onSelectPack: () => {},
  onBack: () => {},
};

export const SEED_PACK_DETAIL: PackDetailProps = {
  pack: SEED_PACK_CARD,
  scenarios: [SEED_SCENARIO_CARD],
  packChallenges: [{ id: "pack_challenge_all_routes", title: "Full Explorer", description: "Discover all routes", completed: false }],
  onSelectScenario: () => {},
  onBack: () => {},
};

export const SEED_SCENARIO_PRE_RUN: ScenarioPreRunProps = {
  scenario: {
    id: "dining_hall",
    title: "Dining Hall",
    summary: "Navigate the messy reality of a crowded dining hall.",
    difficulty: "beginner",
    estimatedMinutes: 10,
    stuckMoment: "standing at the entrance of a crowded dining hall, unsure where to sit",
    practiceAreas: [
      "Staying present during discomfort",
      "Noticing uncertainty without catastrophizing",
      "Tolerating awkward silences",
    ],
  },
  hasBeenPlayed: false,
  onStartRun: () => {},
  onBack: () => {},
};

export const SEED_RUN_SCREEN: RunScreenProps = {
  scenarioTitle: "Dining Hall",
  challengeActive: false,
  currentStep: 0,
  maxSteps: 10,
  stepLabel: "moment",
  metrics: [
    { key: "preparedness", label: "Preparedness", value: 30, max: 100 },
    { key: "comfort", label: "Comfort", value: 20, max: 100 },
    { key: "communication", label: "Communication", value: 40, max: 100 },
  ],
  nodeText: "You push through the heavy doors. The dining hall hits you—clattering trays, overlapping conversations, clusters of people everywhere. Your chest tightens. Everyone looks like they belong. You spot the food line and a few scattered empty tables.\n\nWhat do you do?",
  choices: [
    { id: "entrance_plan", text: "Take a breath and make a micro-plan", description: "Planning gives structure", style: "direct", riskLevel: "moderate", disabled: false },
    { id: "entrance_phone", text: "Pull out phone—safer than standing there", description: "Phone as shield", style: "indirect", riskLevel: "safe", disabled: false },
    { id: "entrance_bail", text: "Turn around—too much", description: "Leaving reinforces avoidance", style: "avoidant", riskLevel: "safe", disabled: false },
  ],
  resultText: null,
  onSelectChoice: () => {},
};

export const SEED_END_OF_RUN_STRONG: EndOfRunSummaryProps = {
  endingTitle: "Confident Step",
  endingText: "You did it. You walked into a crowded dining hall, asked a direct question, and even tried a brief follow-up.",
  observations: [
    "You navigated to a positive outcome",
    "You stayed present through the experience",
    "You engaged beyond the minimum",
  ],
  onReplay: () => {},
  onBackToScenarios: () => {},
};

export const SEED_END_OF_RUN_WEAK: EndOfRunSummaryProps = {
  endingTitle: "Stepping Back",
  endingText: "You stepped away before going further. That's information, not failure.",
  observations: [
    "You noticed when things felt like too much",
  ],
  onReplay: () => {},
  onBackToScenarios: () => {},
};

export const SEED_MASTERY_DASHBOARD: MasteryDashboardProps = {
  scenarioTitle: "Dining Hall",
  tier: "silver",
  bestRun: { score: 285, grade: "A", stars: 3 },
  routes: {
    discovered: [
      { id: "route_direct_confidence", name: "Direct & Confident", description: "Planned, grounded, sat near people, asked follow-up" },
      { id: "route_safe_but_present", name: "Safe But Present", description: "Used phone shield, sat alone" },
    ],
    hidden: [{ hint: "What if you give yourself a second chance?" }],
    percentage: 40,
  },
  objectives: {
    completed: [{ id: "obj_complete", title: "Reach a Positive Ending" }, { id: "obj_stay_for_meal", title: "Stay Through the Meal" }],
    remaining: [{ id: "obj_ask_followup", title: "Ask a Follow-Up Question" }],
  },
  challenges: {
    completed: [],
    remaining: [{ id: "challenge_no_phone", title: "No Phone Shield" }],
  },
  nextTierRequirements: [
    { description: "Earn 3 stars", met: true },
    { description: "Discover 75% routes", met: false },
    { description: "Complete 2+ primary objectives", met: true },
    { description: "Complete 1 challenge", met: false },
  ],
  onPlayAgain: () => {},
  onBack: () => {},
};

export const SEED_ACHIEVEMENTS_SCREEN: AchievementsScreenProps = {
  unlocked: [
    { id: "first_completion", title: "First Steps", description: "Complete your first scenario", icon: "🎯", category: "progress" },
    { id: "first_route", title: "Explorer", description: "Discover your first route", icon: "🗺️", category: "routes" },
  ],
  locked: [
    { id: "first_three_star", title: "Perfect Run", description: "Earn 3 stars on any scenario", icon: "⭐", category: "stars", progress: "0/1" },
    { id: "first_challenge", title: "Challenger", description: "Complete any challenge", icon: "⚡", category: "challenges", progress: "0/1" },
  ],
  onBack: () => {},
};

export const SEED_PROGRESS_SCREEN: ProgressScreenProps = {
  global: { totalXP: 450, rank: "novice", nextRank: "apprentice", xpToNext: 50, totalRuns: 3, scenariosCompleted: 1, packsCompleted: 0, routesDiscovered: 2 },
  recentActivity: [
    { scenarioTitle: "Dining Hall", grade: "A", stars: 3, timestamp: Date.now() - 60000 },
    { scenarioTitle: "Dining Hall", grade: "C", stars: 1, timestamp: Date.now() - 120000 },
    { scenarioTitle: "Dining Hall", grade: "F", stars: 0, timestamp: Date.now() - 180000 },
  ],
  onBack: () => {},
};
