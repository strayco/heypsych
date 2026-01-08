import { redirect } from "next/navigation";

/**
 * Legacy route redirect
 * Old /psych-trail routes now redirect to /psychtrails onboarding
 */
export default function LegacyScenarioRedirect() {
  // Always redirect to the onboarding flow
  redirect("/psychtrails");
}
