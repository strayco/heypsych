/**
 * Support Path Definitions
 *
 * Clinician-defined support paths for the patient journey.
 * All content in this file requires clinical review before launch.
 *
 * @clinicalReviewRequired
 */

import type { SupportPathId, SupportPath, CrisisResource } from "./types";

/**
 * Crisis resources - hardcoded, always available, verified quarterly
 * These MUST work even if JavaScript fails or features are disabled.
 */
export const CRISIS_RESOURCES: CrisisResource[] = [
  {
    name: "988 Suicide & Crisis Lifeline",
    phone: "988",
    available: "24/7",
  },
  {
    name: "Crisis Text Line",
    text: "HOME to 741741",
    available: "24/7",
  },
  {
    name: "SAMHSA National Helpline",
    phone: "1-800-662-4357",
    available: "24/7",
  },
];

/**
 * Support path definitions
 *
 * Each path requires:
 * - Clinician-authored description
 * - Clinician-approved "why this fits" templates
 * - Clinician-approved "considerations" list
 * - Review by clinical authority before launch
 */
export const SUPPORT_PATHS: Record<SupportPathId, Omit<SupportPath, "whyThisFits">> = {
  "crisis-support": {
    id: "crisis-support",
    name: "Crisis Support",
    description:
      "Immediate access to trained crisis counselors who can help you through this moment. These services are free, confidential, and available 24/7.",
    considerations: [
      "Crisis support is for immediate help during a difficult moment",
      "You can always reach out, even if you're unsure whether it's a 'real' crisis",
      "After crisis support, consider connecting with ongoing care",
    ],
    whenBetterFit:
      "If you're looking for ongoing support rather than immediate crisis help, therapy or counseling might be a better fit.",
    typicalFirst:
      "Call or text a crisis line. A trained counselor will listen and help you through this moment.",
  },

  "therapy-counseling": {
    id: "therapy-counseling",
    name: "Talk Therapy",
    description:
      "Regular sessions with a therapist or counselor to work through what you're experiencing. Therapy provides a safe space to understand your thoughts and feelings, develop coping strategies, and work toward your goals.",
    considerations: [
      "Finding the right therapist fit may take a few tries - that's normal",
      "Therapy typically involves weekly or bi-weekly sessions",
      "Many therapists offer video sessions as well as in-person",
      "Insurance often covers therapy, though coverage varies",
    ],
    whenBetterFit:
      "If you're interested in medication or need a diagnostic evaluation, you might also consider a psychiatric evaluation.",
    typicalFirst:
      "Search for therapists in your area or through your insurance. Many offer free consultations to see if it's a good fit.",
  },

  "psychiatric-eval": {
    id: "psychiatric-eval",
    name: "Psychiatric Evaluation",
    description:
      "An assessment by a psychiatrist or psychiatric nurse practitioner. They can provide a diagnostic evaluation and discuss whether medication might help, in addition to therapy.",
    considerations: [
      "A psychiatric evaluation doesn't mean you'll definitely be prescribed medication",
      "Psychiatrists can provide diagnosis and treatment recommendations",
      "Some psychiatrists also provide therapy; many focus primarily on medication management",
      "Wait times for psychiatrists can be longer than for therapists",
    ],
    whenBetterFit:
      "If you're primarily looking for talk therapy and aren't interested in medication, starting with a therapist might be more direct.",
    typicalFirst:
      "Contact a psychiatrist's office or use a psychiatric platform to schedule an evaluation. First appointments are typically 45-60 minutes.",
  },

  "integrated-care": {
    id: "integrated-care",
    name: "Integrated Care",
    description:
      "A combination of therapy and psychiatric services, often at the same practice. This approach coordinates your care so your therapist and prescriber work together.",
    considerations: [
      "Integrated care can be helpful when you benefit from both therapy and medication",
      "Communication between providers is often easier in integrated settings",
      "May be offered through community mental health centers or group practices",
      "Some platforms offer coordinated therapy and psychiatry virtually",
    ],
    whenBetterFit:
      "If you only need one type of support (just therapy or just medication), integrated care may be more than you need.",
    typicalFirst:
      "Look for group practices or community mental health centers that offer both therapy and psychiatry. Ask about care coordination.",
  },

  "peer-support": {
    id: "peer-support",
    name: "Peer Support",
    description:
      "Support groups and peer communities where you can connect with others who have similar experiences. Peer support offers understanding, shared strategies, and a sense of community.",
    considerations: [
      "Peer support complements but doesn't replace professional treatment",
      "Groups exist for many specific concerns (anxiety, depression, grief, etc.)",
      "Both in-person and online options are available",
      "Many peer support resources are free or low-cost",
    ],
    whenBetterFit:
      "If your symptoms are significantly impacting your daily life, professional support alongside peer support may be more helpful.",
    typicalFirst:
      "Search for support groups in your area or online communities focused on what you're experiencing.",
  },

  "digital-tools": {
    id: "digital-tools",
    name: "Digital Tools",
    description:
      "Apps and self-guided programs that teach coping skills, mindfulness, and mental wellness techniques. These can be a starting point or supplement to other support.",
    considerations: [
      "Digital tools work best for mild symptoms or as a supplement to therapy",
      "Quality varies significantly - look for evidence-based apps",
      "Many are available for free or low cost",
      "Self-guided tools require consistent use to see benefits",
    ],
    whenBetterFit:
      "If you're experiencing moderate to severe symptoms, or if self-help hasn't been enough, professional support may be more effective.",
    typicalFirst:
      "Explore evidence-based mental health apps. Many offer free trials to see if they work for you.",
  },

  "primary-care": {
    id: "primary-care",
    name: "Start with Primary Care",
    description:
      "Your regular doctor can be a good starting point for mental health concerns. They can rule out physical causes, provide initial treatment, and refer you to specialists.",
    considerations: [
      "Primary care doctors can prescribe some mental health medications",
      "They can rule out medical conditions that mimic mental health symptoms",
      "If needed, they can refer you to therapists or psychiatrists",
      "This may be a more comfortable first step if mental health feels overwhelming",
    ],
    whenBetterFit:
      "If you already know you want specialized mental health care, going directly to a therapist or psychiatrist may be more efficient.",
    typicalFirst:
      "Schedule an appointment with your regular doctor and mention you'd like to discuss mental health concerns.",
  },
};

/**
 * Required disclaimer for all support path results
 */
export const SUPPORT_PATH_DISCLAIMER =
  "This is not a diagnosis or professional recommendation. " +
  "The information provided is meant to help you explore your options, not replace professional evaluation. " +
  "A mental health professional can help you understand your specific situation and develop a personalized treatment plan.";

/**
 * Get a complete support path with dynamic "why this fits" reasons
 */
export function getSupportPath(
  id: SupportPathId,
  whyThisFits: string[]
): SupportPath {
  const basePath = SUPPORT_PATHS[id];
  return {
    ...basePath,
    whyThisFits,
  };
}

/**
 * Version information for the path definitions
 */
export const PATHS_VERSION = "1.0.0";
