/**
 * Psych Trail - Metrics Display Component
 *
 * Pure renderer: displays current metrics as visual bars/meters.
 * Domain-neutral (driven by scenario UI config).
 */

import type { Metrics, MetricDefinition } from "@/lib/psychTrail/types";

interface MetricsDisplayProps {
  metrics: Metrics;
  config: MetricDefinition[];
  className?: string;
}

export function MetricsDisplay({ metrics, config, className = "" }: MetricsDisplayProps) {
  if (config.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-700">
        Current Status
      </h3>
      <div className="space-y-2">
        {config.map((def) => (
          <MetricBar
            key={def.key}
            label={def.label}
            value={metrics[def.key] ?? 0}
            min={def.min ?? 0}
            max={def.max ?? 100}
            higherIsBetter={def.higherIsBetter ?? true}
          />
        ))}
      </div>
    </div>
  );
}

interface MetricBarProps {
  label: string;
  value: number;
  min: number;
  max: number;
  higherIsBetter: boolean;
}

function MetricBar({ label, value, min, max, higherIsBetter }: MetricBarProps) {
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const color = getMetricColor(percentage, higherIsBetter);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-neutral-700">{label}</span>
        <span className="text-neutral-600">{Math.round(value)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className={`h-full transition-all duration-300 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function getMetricColor(percentage: number, higherIsBetter: boolean): string {
  if (higherIsBetter) {
    if (percentage >= 70) return "bg-green-500";
    if (percentage >= 40) return "bg-yellow-500";
    return "bg-red-500";
  } else {
    // Inverted: lower is better
    if (percentage >= 70) return "bg-red-500";
    if (percentage >= 40) return "bg-yellow-500";
    return "bg-green-500";
  }
}
