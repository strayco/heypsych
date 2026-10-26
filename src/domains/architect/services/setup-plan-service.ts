/**
 * Setup Plan Service
 *
 * Turns a finished blueprint into the ordered work of actually standing the
 * practice up.
 *
 * Honesty rules that shape this file:
 * - A task is something the clinician must do with the vendor or a regulator.
 *   Nothing here claims an account exists, an integration runs, billing is
 *   enabled, EPCS is active, or any compliance obligation has been met. Those
 *   are external states we cannot observe.
 * - Where evidence is missing, the plan says so and asks the clinician to
 *   verify, rather than omitting the question.
 */

import type { PracticeProject } from "../schemas/practice-project";
import type { WorldState } from "../world/world-state";

export type SetupTaskCategory =
  | "decide"
  | "verify"
  | "procure"
  | "configure"
  | "migrate";

export interface SetupTask {
  taskId: string;
  category: SetupTaskCategory;
  title: string;
  /** Why this task exists, in the clinician's terms. */
  detail: string;
  /** Product this task concerns, where it concerns one. */
  productName?: string;
  /** Tasks that should realistically be finished first. */
  dependsOn: string[];
  status: "todo" | "in-progress" | "done";
}

export interface SetupPlanGroup {
  id: string;
  title: string;
  description: string;
  tasks: SetupTask[];
}

export interface SetupPlan {
  groups: SetupPlanGroup[];
  totalTasks: number;
  completedTasks: number;
}

const CATEGORY_LABELS: Record<SetupTaskCategory, string> = {
  decide: "Decide",
  verify: "Verify",
  procure: "Sign up",
  configure: "Set up",
  migrate: "Move data",
};

export function describeCategory(category: SetupTaskCategory): string {
  return CATEGORY_LABELS[category];
}

/**
 * Build the setup plan for a project.
 *
 * Order reflects the real dependency chain: unresolved decisions block
 * everything, verification comes before signing a contract, and migration
 * comes last because it needs a working destination.
 */
export function buildSetupPlan(
  project: PracticeProject,
  world: WorldState
): SetupPlan {
  const statusOf = (taskId: string): SetupTask["status"] =>
    project.setupTasks.find((t) => t.taskId === taskId)?.status ?? "todo";

  const decide: SetupTask[] = world.objects
    .filter((o) => o.state === "unconfigured")
    .map((o) => ({
      taskId: `decide:${o.definition.objectId}`,
      category: "decide" as const,
      title: `Choose how you will handle ${o.definition.name.toLowerCase()}`,
      detail: o.definition.description,
      dependsOn: [],
      status: statusOf(`decide:${o.definition.objectId}`),
    }));

  // One product may cover several objects. Tasks are per product, not per
  // object, so a clinician is never told to sign up for the same tool twice.
  const byProduct = new Map<string, { name: string; needsReview: boolean; reviewReason?: string }>();
  for (const assignment of project.assignments) {
    const existing = byProduct.get(assignment.productSlug);
    byProduct.set(assignment.productSlug, {
      name: assignment.productName,
      needsReview: existing?.needsReview || assignment.needsReview,
      reviewReason: existing?.reviewReason ?? assignment.reviewReason,
    });
  }

  const verify: SetupTask[] = [];
  const procure: SetupTask[] = [];
  const configure: SetupTask[] = [];

  for (const [slug, product] of byProduct) {
    if (product.needsReview) {
      verify.push({
        taskId: `verify:${slug}`,
        category: "verify",
        title: `Confirm ${product.name} does what you need`,
        detail:
          product.reviewReason ??
          "We could not verify this from published information. Check with the vendor before you commit.",
        productName: product.name,
        dependsOn: [],
        status: statusOf(`verify:${slug}`),
      });
    }

    procure.push({
      taskId: `procure:${slug}`,
      category: "procure",
      title: `Open an account with ${product.name}`,
      detail:
        "Pricing and terms are set by the vendor and may differ from our estimate. Confirm the total before you sign.",
      productName: product.name,
      dependsOn: product.needsReview ? [`verify:${slug}`] : [],
      status: statusOf(`procure:${slug}`),
    });

    configure.push({
      taskId: `configure:${slug}`,
      category: "configure",
      title: `Set up ${product.name}`,
      detail:
        "Add your providers, locations, and templates, and check the settings that affect client privacy.",
      productName: product.name,
      dependsOn: [`procure:${slug}`],
      status: statusOf(`configure:${slug}`),
    });
  }

  // A BAA is a legal prerequisite rather than a product feature, so it is
  // listed as its own task against every tool that will touch client data.
  const baa: SetupTask[] = [...byProduct].map(([slug, product]) => ({
    taskId: `baa:${slug}`,
    category: "verify" as const,
    title: `Sign a business associate agreement with ${product.name}`,
    detail:
      "Required before the tool handles any client information. Signing it is between you and the vendor; we cannot confirm it for you.",
    productName: product.name,
    dependsOn: [`procure:${slug}`],
    status: statusOf(`baa:${slug}`),
  }));

  const migrate: SetupTask[] =
    project.profile.stage === "established" ||
    project.profile.stage === "updating"
      ? [
          {
            taskId: "migrate:records",
            category: "migrate",
            title: "Plan how existing records move across",
            detail:
              "Agree the export format and a cut-over date with both vendors, and keep the old system readable until you have checked the import.",
            dependsOn: [...byProduct.keys()].map((s) => `configure:${s}`),
            status: statusOf("migrate:records"),
          },
        ]
      : [];

  const groups: SetupPlanGroup[] = [
    {
      id: "decide",
      title: "Finish your blueprint",
      description: "Decisions still open. Everything else waits on these.",
      tasks: decide,
    },
    {
      id: "verify",
      title: "Check before you commit",
      description:
        "Questions we could not answer from published information.",
      tasks: verify,
    },
    {
      id: "procure",
      title: "Sign up",
      description: "Open accounts with the tools you chose.",
      tasks: procure,
    },
    {
      id: "compliance",
      title: "Paperwork",
      description:
        "Agreements that must be in place before any client data is involved.",
      tasks: baa,
    },
    {
      id: "configure",
      title: "Set up",
      description: "Configure each tool for how your practice actually works.",
      tasks: configure,
    },
    {
      id: "migrate",
      title: "Move across",
      description: "Bring your existing practice over safely.",
      tasks: migrate,
    },
  ].filter((group) => group.tasks.length > 0);

  const allTasks = groups.flatMap((g) => g.tasks);

  return {
    groups,
    totalTasks: allTasks.length,
    completedTasks: allTasks.filter((t) => t.status === "done").length,
  };
}

/**
 * Render the plan as plain text for export.
 *
 * Plain text rather than a proprietary format: a clinician should be able to
 * paste this into an email to their practice manager without our involvement.
 */
export function formatSetupPlanAsText(
  project: PracticeProject,
  plan: SetupPlan
): string {
  const lines: string[] = [
    project.name,
    "Setup plan from HeyPsych Practice Architect",
    `Generated ${new Date().toLocaleDateString()}`,
    "",
    `${plan.completedTasks} of ${plan.totalTasks} tasks complete`,
    "",
  ];

  for (const group of plan.groups) {
    lines.push(group.title.toUpperCase(), group.description, "");
    for (const task of group.tasks) {
      lines.push(`  [${task.status === "done" ? "x" : " "}] ${task.title}`);
      lines.push(`      ${task.detail}`);
    }
    lines.push("");
  }

  lines.push(
    "This plan reflects decisions you made in Practice Architect.",
    "It does not create accounts, enable billing, or establish compliance.",
    "Confirm pricing, terms, and regulatory requirements with each vendor."
  );

  return lines.join("\n");
}
