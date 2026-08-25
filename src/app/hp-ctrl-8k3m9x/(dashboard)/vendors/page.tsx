/**
 * Vendor Management Dashboard
 *
 * Manage product profiles, vendor claims, and verification status.
 */

import Link from "next/link";
import {
  Building2,
  Search,
  Filter,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpDown,
  ExternalLink,
  MoreHorizontal,
} from "lucide-react";

// Vendor status types
type VendorStatus = "claimed" | "verified" | "premium" | "unclaimed";

interface VendorListing {
  slug: string;
  name: string;
  company: string;
  category: string;
  status: VendorStatus;
  claimDate?: string;
  monthlyRevenue?: string;
  leadsThisMonth: number;
  dataCompleteness: number;
}

// Placeholder data - will be replaced with real API data
const VENDORS: VendorListing[] = [
  {
    slug: "simplepractice",
    name: "SimplePractice",
    company: "SimplePractice, LLC",
    category: "ehr",
    status: "premium",
    claimDate: "2024-01-15",
    monthlyRevenue: "$699",
    leadsThisMonth: 24,
    dataCompleteness: 95,
  },
  {
    slug: "therapynotes",
    name: "TherapyNotes",
    company: "TherapyNotes, LLC",
    category: "ehr",
    status: "verified",
    claimDate: "2024-02-20",
    monthlyRevenue: "$299",
    leadsThisMonth: 18,
    dataCompleteness: 88,
  },
  {
    slug: "freed",
    name: "Freed",
    company: "Freed AI",
    category: "ai-scribe",
    status: "claimed",
    claimDate: "2024-03-10",
    leadsThisMonth: 12,
    dataCompleteness: 72,
  },
  {
    slug: "nabla",
    name: "Nabla",
    company: "Nabla, Inc.",
    category: "ai-scribe",
    status: "unclaimed",
    leadsThisMonth: 8,
    dataCompleteness: 45,
  },
  {
    slug: "headway",
    name: "Headway",
    company: "Headway",
    category: "provider-network",
    status: "unclaimed",
    leadsThisMonth: 15,
    dataCompleteness: 52,
  },
];

const STATUS_CONFIG: Record<VendorStatus, { label: string; color: string; icon: React.ElementType }> = {
  premium: {
    label: "Premium",
    color: "bg-accent/10 text-accent",
    icon: CheckCircle,
  },
  verified: {
    label: "Verified",
    color: "bg-positive/10 text-positive",
    icon: CheckCircle,
  },
  claimed: {
    label: "Claimed",
    color: "bg-warning/10 text-warning",
    icon: Clock,
  },
  unclaimed: {
    label: "Unclaimed",
    color: "bg-label-quaternary/10 text-label-quaternary",
    icon: XCircle,
  },
};

export default function VendorsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-label-primary">Vendors</h1>
          <p className="mt-1 text-label-secondary">
            Manage product profiles and vendor relationships.
          </p>
        </div>
        <Link
          href="/admin/vendors/new"
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-label-quaternary" />
          <input
            type="text"
            placeholder="Search vendors..."
            className="w-full rounded-lg border border-separator bg-surface pl-10 pr-4 py-2 text-sm text-label-primary placeholder:text-label-quaternary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-lg border border-separator bg-surface px-4 py-2 text-sm text-label-secondary hover:bg-fill-secondary">
            <Filter className="h-4 w-4" />
            Status
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-separator bg-surface px-4 py-2 text-sm text-label-secondary hover:bg-fill-secondary">
            <Filter className="h-4 w-4" />
            Category
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-separator bg-surface">
        <table className="w-full">
          <thead>
            <tr className="border-b border-separator bg-canvas">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-label-tertiary">
                <button className="flex items-center gap-1 hover:text-label-primary">
                  Product
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-label-tertiary">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-label-tertiary">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-label-tertiary">
                <button className="flex items-center gap-1 hover:text-label-primary">
                  Leads
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-label-tertiary">
                Data
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-label-tertiary">
                Revenue
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-label-tertiary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-separator">
            {VENDORS.map((vendor) => {
              const statusConfig = STATUS_CONFIG[vendor.status];
              const StatusIcon = statusConfig.icon;
              return (
                <tr
                  key={vendor.slug}
                  className="transition-colors hover:bg-fill-secondary"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-sm font-semibold text-accent">
                        {vendor.name.charAt(0)}
                      </div>
                      <div>
                        <Link
                          href={`/admin/vendors/${vendor.slug}`}
                          className="font-medium text-label-primary hover:text-accent"
                        >
                          {vendor.name}
                        </Link>
                        <p className="text-xs text-label-tertiary">
                          {vendor.company}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-separator px-2.5 py-0.5 text-xs font-medium text-label-secondary capitalize">
                      {vendor.category.replace("-", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.color}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-label-primary">
                      {vendor.leadsThisMonth}
                    </span>
                    <span className="text-xs text-label-tertiary"> /mo</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 rounded-full bg-separator">
                        <div
                          className="h-2 rounded-full bg-accent"
                          style={{ width: `${vendor.dataCompleteness}%` }}
                        />
                      </div>
                      <span className="text-xs text-label-tertiary">
                        {vendor.dataCompleteness}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-label-primary">
                      {vendor.monthlyRevenue || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/tools/for-clinicians/${vendor.category}/${vendor.slug}/`}
                        target="_blank"
                        className="rounded-lg p-2 text-label-tertiary hover:bg-separator hover:text-label-primary"
                        title="View public page"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                      <button
                        className="rounded-lg p-2 text-label-tertiary hover:bg-separator hover:text-label-primary"
                        title="More actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
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
        <p className="text-sm text-label-tertiary">
          Showing 1-5 of 80 products
        </p>
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
