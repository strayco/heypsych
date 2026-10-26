/**
 * Step Three: Your Setup Plan
 *
 * The blueprint turned into ordered work.
 *
 * Every task describes something the clinician does with a vendor or a
 * regulator. Ticking one records their own progress; it never asserts that an
 * account exists, billing works, or a compliance obligation has been met.
 */

"use client";

import { Check, Download } from "lucide-react";
import type { PracticeProject } from "@/domains/architect/schemas/practice-project";
import {
  buildSetupPlan,
  describeCategory,
  formatSetupPlanAsText,
  type SetupTask,
} from "@/domains/architect/services/setup-plan-service";
import type { WorldState } from "@/domains/architect/world/world-state";

interface SetupPlanProps {
  project: PracticeProject;
  world: WorldState;
  onSetTaskStatus: (
    taskId: string,
    status: "todo" | "in-progress" | "done"
  ) => void;
}

export function SetupPlan({
  project,
  world,
  onSetTaskStatus,
}: SetupPlanProps) {
  const plan = buildSetupPlan(project, world);

  const download = () => {
    const blob = new Blob([formatSetupPlanAsText(project, plan)], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-setup-plan.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (plan.totalTasks === 0) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12 text-center">
        <p className="text-sm text-label-secondary">
          Choose some tools in your blueprint and your setup plan will appear
          here.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-label-primary">
            Your setup plan
          </h2>
          <p className="mt-0.5 text-sm text-label-secondary">
            {plan.completedTasks} of {plan.totalTasks} done
          </p>
        </div>
        <button
          onClick={download}
          className="inline-flex items-center gap-1.5 rounded-lg border border-separator bg-surface px-3 py-2 text-xs font-medium text-label-secondary transition-colors hover:bg-fill-quaternary"
        >
          <Download className="h-3.5 w-3.5" />
          Download as text
        </button>
      </div>

      {plan.groups.map((group) => (
        <section key={group.id} className="mb-7">
          <h3 className="text-sm font-semibold text-label-primary">
            {group.title}
          </h3>
          <p className="mb-3 text-xs text-label-tertiary">
            {group.description}
          </p>

          <ul className="space-y-1.5">
            {group.tasks.map((task) => (
              <li key={task.taskId}>
                <TaskRow
                  task={task}
                  onToggle={() =>
                    onSetTaskStatus(
                      task.taskId,
                      task.status === "done" ? "todo" : "done"
                    )
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/* The limits of this plan, stated rather than implied. */}
      <p className="mt-8 rounded-xl border border-separator bg-fill-quaternary p-3 text-xs leading-relaxed text-label-tertiary">
        This plan records decisions you made here. Ticking a task does not
        create an account, enable billing or e-prescribing, or establish
        compliance with any regulation — those happen with the vendor, and we
        cannot see them. Confirm pricing and terms directly before you sign.
      </p>
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
}: {
  task: SetupTask;
  onToggle: () => void;
}) {
  const done = task.status === "done";

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${
        done
          ? "border-separator bg-fill-quaternary"
          : "border-separator bg-surface"
      }`}
    >
      <button
        onClick={onToggle}
        role="checkbox"
        aria-checked={done}
        aria-label={task.title}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
          done
            ? "border-positive bg-positive text-white"
            : "border-separator-opaque hover:border-accent"
        }`}
      >
        {done && <Check className="h-3.5 w-3.5" />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-fill-tertiary px-2 py-0.5 text-[11px] font-medium text-label-secondary">
            {describeCategory(task.category)}
          </span>
          <span
            className={`text-sm font-medium ${
              done
                ? "text-label-tertiary line-through"
                : "text-label-primary"
            }`}
          >
            {task.title}
          </span>
        </div>
        <p className="mt-1 text-xs leading-snug text-label-secondary">
          {task.detail}
        </p>
      </div>
    </div>
  );
}
