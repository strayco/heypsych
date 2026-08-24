/**
 * Admin Dashboard Home
 *
 * Overview of key metrics, pending actions, and quick links.
 */

import Link from "next/link";
import {
  Building2,
  Users,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Clock,
} from "lucide-react";

// Placeholder metrics - will be replaced with real data
const METRICS = [
  {
    label: "Total Products",
    value: "80",
    change: "+3 this week",
    changeType: "positive" as const,
    href: "/admin/vendors",
    icon: Building2,
  },
  {
    label: "Pending Claims",
    value: "5",
    change: "2 high priority",
    changeType: "warning" as const,
    href: "/admin/vendors?status=pending",
    icon: Clock,
  },
  {
    label: "Leads This Week",
    value: "42",
    change: "+15% vs last week",
    changeType: "positive" as const,
    href: "/admin/leads",
    icon: Users,
  },
  {
    label: "Demo Requests",
    value: "8",
    change: "3 pending",
    changeType: "neutral" as const,
    href: "/admin/leads?intent=demo-request",
    icon: TrendingUp,
  },
];

const PENDING_ACTIONS = [
  {
    type: "claim",
    title: "New vendor claim: SimplePractice",
    priority: "high",
    time: "2 hours ago",
    href: "/admin/vendors/claims/123",
  },
  {
    type: "claim",
    title: "New vendor claim: TherapyNotes",
    priority: "medium",
    time: "5 hours ago",
    href: "/admin/vendors/claims/124",
  },
  {
    type: "lead",
    title: "Hot lead: Demo request for Freed",
    priority: "high",
    time: "1 hour ago",
    href: "/admin/leads/456",
  },
  {
    type: "content",
    title: "New comparison needs review",
    priority: "low",
    time: "1 day ago",
    href: "/admin/content/comparisons/789",
  },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-label-primary">Dashboard</h1>
        <p className="mt-1 text-label-secondary">
          Overview of HeyPsych operations and pending actions.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((metric) => {
          const Icon = metric.icon;
          return (
            <Link
              key={metric.label}
              href={metric.href}
              className="group rounded-xl border border-separator bg-surface p-5 transition-all hover:border-accent/30 hover:shadow-soft"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <ArrowRight className="h-4 w-4 text-label-quaternary transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-label-primary">
                  {metric.value}
                </p>
                <p className="text-sm text-label-secondary">{metric.label}</p>
              </div>
              <p
                className={`mt-2 text-xs ${
                  metric.changeType === "positive"
                    ? "text-positive"
                    : metric.changeType === "warning"
                    ? "text-warning"
                    : "text-label-tertiary"
                }`}
              >
                {metric.change}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Pending Actions */}
      <div className="rounded-xl border border-separator bg-surface">
        <div className="flex items-center justify-between border-b border-separator px-5 py-4">
          <h2 className="font-semibold text-label-primary">Pending Actions</h2>
          <span className="rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
            {PENDING_ACTIONS.length} items
          </span>
        </div>
        <div className="divide-y divide-separator">
          {PENDING_ACTIONS.map((action, idx) => (
            <Link
              key={idx}
              href={action.href}
              className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-fill-secondary"
            >
              <div className="flex items-center gap-3">
                {action.priority === "high" ? (
                  <AlertCircle className="h-5 w-5 text-negative" />
                ) : action.priority === "medium" ? (
                  <Clock className="h-5 w-5 text-warning" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-label-quaternary" />
                )}
                <div>
                  <p className="text-sm font-medium text-label-primary">
                    {action.title}
                  </p>
                  <p className="text-xs text-label-tertiary">{action.time}</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-label-quaternary" />
            </Link>
          ))}
        </div>
        <div className="border-t border-separator px-5 py-3">
          <Link
            href="/admin/actions"
            className="text-sm font-medium text-accent hover:text-accent-hover"
          >
            View all pending actions →
          </Link>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/vendors/new"
          className="rounded-xl border border-separator bg-surface p-5 text-center transition-all hover:border-accent/30"
        >
          <Building2 className="mx-auto h-8 w-8 text-accent" />
          <p className="mt-3 font-medium text-label-primary">Add New Product</p>
          <p className="mt-1 text-sm text-label-secondary">
            Create a new product profile
          </p>
        </Link>
        <Link
          href="/admin/content/comparisons/new"
          className="rounded-xl border border-separator bg-surface p-5 text-center transition-all hover:border-accent/30"
        >
          <TrendingUp className="mx-auto h-8 w-8 text-accent" />
          <p className="mt-3 font-medium text-label-primary">New Comparison</p>
          <p className="mt-1 text-sm text-label-secondary">
            Create a curated comparison
          </p>
        </Link>
        <Link
          href="/admin/leads/export"
          className="rounded-xl border border-separator bg-surface p-5 text-center transition-all hover:border-accent/30"
        >
          <Users className="mx-auto h-8 w-8 text-accent" />
          <p className="mt-3 font-medium text-label-primary">Export Leads</p>
          <p className="mt-1 text-sm text-label-secondary">
            Download lead data for CRM
          </p>
        </Link>
      </div>
    </div>
  );
}
