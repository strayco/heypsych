/**
 * Lead Management Dashboard
 *
 * View, filter, and manage captured leads.
 * Supports lead qualification and CRM export.
 */

import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  Download,
  Mail,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowUpDown,
  ExternalLink,
} from "lucide-react";

// Lead tier types
type LeadTier = "hot" | "warm" | "cold";
type LeadIntent =
  | "newsletter"
  | "product-interest"
  | "comparison-interest"
  | "demo-request"
  | "pricing-interest"
  | "switching"
  | "content-download"
  | "architect-save";

interface Lead {
  id: string;
  email: string;
  intent: LeadIntent;
  tier: LeadTier;
  score: number;
  productSlugs?: string[];
  source: string;
  createdAt: string;
  status: "new" | "contacted" | "qualified" | "converted";
}

// Placeholder data
const LEADS: Lead[] = [
  {
    id: "1",
    email: "dr.smith@therapypractice.com",
    intent: "demo-request",
    tier: "hot",
    score: 85,
    productSlugs: ["simplepractice"],
    source: "/tools/for-clinicians/ehr/simplepractice/",
    createdAt: "2024-03-15T10:30:00Z",
    status: "new",
  },
  {
    id: "2",
    email: "jane@mentalhealth.org",
    intent: "switching",
    tier: "hot",
    score: 92,
    productSlugs: ["freed", "nabla"],
    source: "/tools/switch-from/therapynotes",
    createdAt: "2024-03-15T09:15:00Z",
    status: "contacted",
  },
  {
    id: "3",
    email: "admin@grouptherapy.com",
    intent: "comparison-interest",
    tier: "warm",
    score: 55,
    productSlugs: ["simplepractice", "therapynotes"],
    source: "/tools/compare?tools=simplepractice,therapynotes",
    createdAt: "2024-03-14T16:45:00Z",
    status: "new",
  },
  {
    id: "4",
    email: "newtherapist@gmail.com",
    intent: "architect-save",
    tier: "warm",
    score: 48,
    source: "/architect/build",
    createdAt: "2024-03-14T14:20:00Z",
    status: "qualified",
  },
  {
    id: "5",
    email: "reader@email.com",
    intent: "newsletter",
    tier: "cold",
    score: 15,
    source: "/tools/for-clinicians/",
    createdAt: "2024-03-13T11:00:00Z",
    status: "new",
  },
];

const TIER_CONFIG: Record<LeadTier, { label: string; color: string }> = {
  hot: { label: "Hot", color: "bg-negative/10 text-negative" },
  warm: { label: "Warm", color: "bg-warning/10 text-warning" },
  cold: { label: "Cold", color: "bg-label-quaternary/10 text-label-quaternary" },
};

const INTENT_LABELS: Record<LeadIntent, string> = {
  newsletter: "Newsletter",
  "product-interest": "Product Interest",
  "comparison-interest": "Comparison",
  "demo-request": "Demo Request",
  "pricing-interest": "Pricing",
  switching: "Switching",
  "content-download": "Download",
  "architect-save": "Practice Architect™",
};

const STATUS_CONFIG = {
  new: { label: "New", icon: Clock, color: "text-accent" },
  contacted: { label: "Contacted", icon: Mail, color: "text-warning" },
  qualified: { label: "Qualified", icon: TrendingUp, color: "text-positive" },
  converted: { label: "Converted", icon: CheckCircle, color: "text-positive" },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-label-primary">Leads</h1>
          <p className="mt-1 text-label-secondary">
            Manage and qualify captured leads.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover">
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total Leads", value: "156", subtext: "This month" },
          { label: "Hot Leads", value: "23", subtext: "Score ≥60" },
          { label: "Demo Requests", value: "18", subtext: "Pending" },
          { label: "Conversion Rate", value: "12%", subtext: "+2% vs last month" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-separator bg-surface p-4"
          >
            <p className="text-2xl font-bold text-label-primary">{stat.value}</p>
            <p className="text-sm text-label-secondary">{stat.label}</p>
            <p className="mt-1 text-xs text-label-tertiary">{stat.subtext}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-label-quaternary" />
          <input
            type="text"
            placeholder="Search by email..."
            className="w-full rounded-lg border border-separator bg-surface pl-10 pr-4 py-2 text-sm text-label-primary placeholder:text-label-quaternary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-lg border border-separator bg-surface px-4 py-2 text-sm text-label-secondary hover:bg-fill-secondary">
            <Filter className="h-4 w-4" />
            Tier
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-separator bg-surface px-4 py-2 text-sm text-label-secondary hover:bg-fill-secondary">
            <Filter className="h-4 w-4" />
            Intent
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-separator bg-surface px-4 py-2 text-sm text-label-secondary hover:bg-fill-secondary">
            <Filter className="h-4 w-4" />
            Status
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-separator bg-surface">
        <table className="w-full">
          <thead>
            <tr className="border-b border-separator bg-canvas">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-label-tertiary">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-label-tertiary">
                Intent
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-label-tertiary">
                <button className="flex items-center gap-1 hover:text-label-primary">
                  Score
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-label-tertiary">
                Products
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-label-tertiary">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-label-tertiary">
                <button className="flex items-center gap-1 hover:text-label-primary">
                  Created
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-label-tertiary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-separator">
            {LEADS.map((lead) => {
              const tierConfig = TIER_CONFIG[lead.tier];
              const statusConfig = STATUS_CONFIG[lead.status];
              const StatusIcon = statusConfig.icon;
              return (
                <tr
                  key={lead.id}
                  className="transition-colors hover:bg-fill-secondary"
                >
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-label-primary">
                        {lead.email}
                      </p>
                      <p className="text-xs text-label-tertiary truncate max-w-[200px]">
                        {lead.source}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-label-primary">
                        {INTENT_LABELS[lead.intent]}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${tierConfig.color}`}
                      >
                        {tierConfig.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-12 rounded-full bg-separator">
                        <div
                          className={`h-2 rounded-full ${
                            lead.score >= 60
                              ? "bg-negative"
                              : lead.score >= 30
                              ? "bg-warning"
                              : "bg-label-quaternary"
                          }`}
                          style={{ width: `${lead.score}%` }}
                        />
                      </div>
                      <span className="text-sm text-label-primary">
                        {lead.score}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {lead.productSlugs && lead.productSlugs.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {lead.productSlugs.slice(0, 2).map((slug) => (
                          <span
                            key={slug}
                            className="rounded bg-separator px-2 py-0.5 text-xs text-label-secondary"
                          >
                            {slug}
                          </span>
                        ))}
                        {lead.productSlugs.length > 2 && (
                          <span className="text-xs text-label-tertiary">
                            +{lead.productSlugs.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-label-quaternary">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1 text-sm ${statusConfig.color}`}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-label-secondary">
                      {formatDate(lead.createdAt)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10"
                      >
                        View
                      </Link>
                      <button className="rounded-lg px-3 py-1.5 text-xs font-medium text-label-secondary hover:bg-separator">
                        Contact
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-label-tertiary">Showing 1-5 of 156 leads</p>
        <div className="flex gap-2">
          <button
            disabled
            className="rounded-lg border border-separator bg-surface px-4 py-2 text-sm text-label-quaternary"
          >
            Previous
          </button>
          <button className="rounded-lg border border-separator bg-surface px-4 py-2 text-sm text-label-secondary hover:bg-fill-secondary">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
