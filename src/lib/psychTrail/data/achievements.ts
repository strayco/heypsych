import type { Achievement } from "../types-v2";

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_completion", title: "First Steps", description: "Complete your first scenario", category: "progress", icon: "🎯", condition: { type: "scenarios-completed", count: 1 }, xpReward: 50 },
  { id: "five_completions", title: "Getting Started", description: "Complete 5 scenarios", category: "progress", icon: "🚀", condition: { type: "scenarios-completed", count: 5 }, xpReward: 100 },
  { id: "twenty_five_completions", title: "Dedicated", description: "Complete 25 scenarios", category: "progress", icon: "💪", condition: { type: "scenarios-completed", count: 25 }, xpReward: 250 },
  { id: "first_three_star", title: "Perfect Run", description: "Earn 3 stars on any scenario", category: "stars", icon: "⭐", condition: { type: "three-stars" }, xpReward: 75 },
  { id: "fifty_stars", title: "Constellation", description: "Earn 50 total stars", category: "stars", icon: "✨", condition: { type: "stars-earned", count: 50 }, xpReward: 300 },
  { id: "first_route", title: "Explorer", description: "Discover your first route", category: "routes", icon: "🗺️", condition: { type: "routes-discovered", count: 1 }, xpReward: 25 },
  { id: "ten_routes", title: "Pathfinder", description: "Discover 10 routes", category: "routes", icon: "🧭", condition: { type: "routes-discovered", count: 10 }, xpReward: 100 },
  { id: "hidden_route_found", title: "Secret Seeker", description: "Discover a hidden route", category: "routes", icon: "🔍", condition: { type: "hidden-route-discovered" }, xpReward: 100 },
  { id: "first_bronze", title: "Bronze Beginner", description: "Achieve Bronze mastery", category: "mastery", icon: "🥉", condition: { type: "mastery-tier", tier: "bronze" }, xpReward: 25 },
  { id: "first_silver", title: "Silver Standard", description: "Achieve Silver mastery", category: "mastery", icon: "🥈", condition: { type: "mastery-tier", tier: "silver" }, xpReward: 75 },
  { id: "first_gold", title: "Gold Medal", description: "Achieve Gold mastery", category: "mastery", icon: "🥇", condition: { type: "mastery-tier", tier: "gold" }, xpReward: 150 },
  { id: "first_platinum", title: "Platinum Champion", description: "Achieve Platinum mastery", category: "mastery", icon: "🏆", condition: { type: "mastery-tier", tier: "platinum" }, xpReward: 300 },
  { id: "first_challenge", title: "Challenger", description: "Complete any challenge", category: "challenges", icon: "⚡", condition: { type: "challenge-completed" }, xpReward: 100 },
  { id: "no_safety_behaviors", title: "No Safety Net", description: "Complete No Phone Shield challenge", category: "challenges", icon: "📵", condition: { type: "challenge-completed", challengeId: "challenge_no_phone" }, xpReward: 150 },
  { id: "speedster", title: "Speedster", description: "Complete a speedrun challenge", category: "challenges", icon: "⏱️", condition: { type: "challenge-completed", challengeId: "challenge_quick_confidence" }, xpReward: 200 },
  { id: "s_rank", title: "S-Rank", description: "Achieve S grade", category: "performance", icon: "💎", condition: { type: "grade-achieved", grade: "S" }, xpReward: 200 },
  { id: "comeback_kid", title: "Comeback Kid", description: "Bail then return and succeed", category: "performance", icon: "🔄", condition: { type: "comeback" }, xpReward: 150 },
  { id: "pack_social_anxiety_complete", title: "Social Warrior", description: "Complete Social Anxiety Fundamentals pack", category: "packs", icon: "🎯", condition: { type: "pack-completed", packId: "social-anxiety-fundamentals" }, xpReward: 250 },
  { id: "first_pack_complete", title: "Pack Master", description: "Complete any pack", category: "packs", icon: "📦", condition: { type: "packs-completed", count: 1 }, xpReward: 200 },
  { id: "dining_hall_complete", title: "First Meal", description: "Complete the Dining Hall scenario", category: "progress", icon: "🍽️", condition: { type: "scenario-completed", scenarioId: "dining_hall" }, xpReward: 50 },
  { id: "dining_hall_all_routes", title: "Dining Hall Explorer", description: "Discover all routes in Dining Hall", category: "routes", icon: "🗺️", condition: { type: "all-routes-scenario", scenarioId: "dining_hall" }, xpReward: 150 },
];

export function getAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
