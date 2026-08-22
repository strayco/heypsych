"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  MessageCircle,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  getFollowUpRequests,
  getTransferCommitments,
} from "@/lib/psychTrail/campus-storage";
import type { FollowUpRequest, TransferCommitment } from "@/lib/psychTrail/institutional-types";

// Demo data for realistic preview
const DEMO_FOLLOW_UP_REQUESTS: FollowUpRequest[] = [
  {
    id: "demo_1",
    institutionId: "inst_demo",
    cohortId: null,
    staffReferralId: null,
    studentIdentifier: "jamie.c@university.edu",
    scenarioId: "dining_hall_alone",
    scenarioTitle: "Eating Alone in the Dining Hall",
    transferPrompt: "Sit at a table near others tomorrow at lunch",
    selectedAction: "talk_to_someone",
    smallestBetterMove: "Just walk through the dining hall once",
    timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
    resolved: false,
    resolvedBy: null,
    resolvedAt: null,
    resolvedNotes: null,
  },
  {
    id: "demo_2",
    institutionId: "inst_demo",
    cohortId: null,
    staffReferralId: "ref_counselor_martinez",
    studentIdentifier: "Alex R. - Tuesdays after 2pm work best",
    scenarioId: "office_hours_anxiety",
    scenarioTitle: "Going to Office Hours",
    transferPrompt: "Email professor to schedule a meeting",
    selectedAction: "commit_24h",
    smallestBetterMove: null,
    timestamp: Date.now() - 18 * 60 * 60 * 1000, // 18 hours ago
    resolved: false,
    resolvedBy: null,
    resolvedAt: null,
    resolvedNotes: null,
  },
  {
    id: "demo_3",
    institutionId: "inst_demo",
    cohortId: "cohort_ra_training",
    staffReferralId: null,
    studentIdentifier: "Morgan K. (RA in Westwood Hall)",
    scenarioId: "asking_for_help",
    scenarioTitle: "Asking for Academic Help",
    transferPrompt: "Visit the tutoring center this week",
    selectedAction: "smaller_step",
    smallestBetterMove: "Look up tutoring center hours online",
    timestamp: Date.now() - 36 * 60 * 60 * 1000, // 36 hours ago
    resolved: false,
    resolvedBy: null,
    resolvedAt: null,
    resolvedNotes: null,
  },
];

const DEMO_COMMITMENTS: TransferCommitment[] = [
  {
    runId: "run_1",
    scenarioId: "dining_hall_alone",
    transferPrompt: "Sit at a table near others",
    selectedAction: "commit_24h",
    concreteCommitment: "Sit at a table near others",
    smallestBetterMoveSelected: false,
    campusResourceClicked: null,
    followUpRequested: false,
    sharedWithStaff: false,
    timestamp: Date.now() - 15 * 60 * 1000,
  },
  {
    runId: "run_2",
    scenarioId: "office_hours_anxiety",
    transferPrompt: "Email professor",
    selectedAction: "talk_to_someone",
    concreteCommitment: null,
    smallestBetterMoveSelected: false,
    campusResourceClicked: "counseling",
    followUpRequested: true,
    sharedWithStaff: true,
    timestamp: Date.now() - 45 * 60 * 1000,
  },
  {
    runId: "run_3",
    scenarioId: "dining_hall_alone",
    transferPrompt: "Sit at a table near others",
    selectedAction: "practice_only",
    concreteCommitment: null,
    smallestBetterMoveSelected: false,
    campusResourceClicked: null,
    followUpRequested: false,
    sharedWithStaff: false,
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
  },
  {
    runId: "run_4",
    scenarioId: "asking_for_help",
    transferPrompt: "Visit tutoring center",
    selectedAction: "commit_24h",
    concreteCommitment: "Visit tutoring center",
    smallestBetterMoveSelected: false,
    campusResourceClicked: null,
    followUpRequested: false,
    sharedWithStaff: false,
    timestamp: Date.now() - 3 * 60 * 60 * 1000,
  },
  {
    runId: "run_5",
    scenarioId: "office_hours_anxiety",
    transferPrompt: "Email professor",
    selectedAction: "smaller_step",
    concreteCommitment: null,
    smallestBetterMoveSelected: true,
    campusResourceClicked: null,
    followUpRequested: false,
    sharedWithStaff: false,
    timestamp: Date.now() - 5 * 60 * 60 * 1000,
  },
  {
    runId: "run_6",
    scenarioId: "dining_hall_alone",
    transferPrompt: "Sit at a table near others",
    selectedAction: "commit_24h",
    concreteCommitment: "Sit at a table near others",
    smallestBetterMoveSelected: false,
    campusResourceClicked: null,
    followUpRequested: false,
    sharedWithStaff: false,
    timestamp: Date.now() - 8 * 60 * 60 * 1000,
  },
  {
    runId: "run_7",
    scenarioId: "asking_for_help",
    transferPrompt: "Visit tutoring center",
    selectedAction: "talk_to_someone",
    concreteCommitment: null,
    smallestBetterMoveSelected: false,
    campusResourceClicked: "wellness",
    followUpRequested: true,
    sharedWithStaff: true,
    timestamp: Date.now() - 12 * 60 * 60 * 1000,
  },
  {
    runId: "run_8",
    scenarioId: "dining_hall_alone",
    transferPrompt: "Sit at a table near others",
    selectedAction: "commit_24h",
    concreteCommitment: "Sit at a table near others",
    smallestBetterMoveSelected: false,
    campusResourceClicked: null,
    followUpRequested: false,
    sharedWithStaff: false,
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
  },
];

// Demo institutions
const DEMO_INSTITUTIONS: Record<string, { id: string; name: string }> = {
  "state-u": { id: "inst_state_u", name: "State University" },
  "demo-college": { id: "inst_demo", name: "Greenfield College" },
  "cmh": { id: "inst_cmh", name: "College of Mental Health" },
};

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
}) {
  return (
    <div className="rounded-xl border border-separator bg-surface-grouped p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-500/15 border border-accent-500/20">
          <Icon className="h-5 w-5 text-accent" />
        </div>
        <span className="text-sm font-medium text-label-tertiary">{label}</span>
      </div>
      <div className="text-2xl font-bold text-label-primary">{value}</div>
      {subtext && <p className="text-xs text-label-primary0 mt-1">{subtext}</p>}
    </div>
  );
}

function FollowUpCard({ request }: { request: FollowUpRequest }) {
  const timeAgo = getTimeAgo(request.timestamp);

  return (
    <div className="rounded-xl border border-separator bg-surface-grouped p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-medium text-label-primary">{request.studentIdentifier}</p>
          <p className="text-xs text-label-primary0">{timeAgo}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-caution-tint border border-caution-700/30 px-2 py-0.5 text-xs font-medium text-caution">
          <AlertCircle className="h-3 w-3" />
          Pending
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <span className="text-label-primary0">Scenario:</span>{" "}
          <span className="text-label-secondary">{request.scenarioTitle}</span>
        </div>
        <div>
          <span className="text-label-primary0">Next step:</span>{" "}
          <span className="text-label-secondary">{request.transferPrompt}</span>
        </div>
        {request.smallestBetterMove && (
          <div>
            <span className="text-label-primary0">Considering:</span>{" "}
            <span className="text-label-secondary">{request.smallestBetterMove}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button className="flex-1 rounded-lg bg-accent-600 px-3 py-2 text-sm font-medium text-white hover:bg-accent-500 transition-colors">
          Mark Contacted
        </button>
        <button className="rounded-lg border border-separator px-3 py-2 text-sm font-medium text-label-secondary hover:bg-fill-secondary transition-colors">
          Dismiss
        </button>
      </div>
    </div>
  );
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function CampusDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const institutionSlug = params.institutionSlug as string;

  const [institution, setInstitution] = useState<{ id: string; name: string } | null>(null);
  const [followUpRequests, setFollowUpRequests] = useState<FollowUpRequest[]>([]);
  const [commitments, setCommitments] = useState<TransferCommitment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    const inst = DEMO_INSTITUTIONS[institutionSlug];
    if (inst) {
      setInstitution(inst);
      // Merge demo data with any real localStorage data
      const realFollowUps = getFollowUpRequests();
      const realCommitments = getTransferCommitments();
      setFollowUpRequests([...DEMO_FOLLOW_UP_REQUESTS, ...realFollowUps]);
      setCommitments([...DEMO_COMMITMENTS, ...realCommitments]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadData is stable and intentionally only re-runs when institutionSlug changes
  }, [institutionSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="animate-pulse text-label-primary0">Loading...</div>
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center">
          <p className="text-label-tertiary">Institution not found</p>
          <button
            onClick={() => router.push("/psychtrails")}
            className="mt-4 text-accent hover:text-accent-700 transition-colors"
          >
            Go to PsychTrails →
          </button>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalSessions = commitments.length;
  const pendingFollowUps = followUpRequests.filter((r) => !r.resolved).length;
  const commitRate = totalSessions > 0
    ? Math.round((commitments.filter((c) => c.selectedAction === "commit_24h").length / totalSessions) * 100)
    : 0;
  const talkToSomeoneRate = totalSessions > 0
    ? Math.round((commitments.filter((c) => c.selectedAction === "talk_to_someone").length / totalSessions) * 100)
    : 0;

  // Recent activity (last 7 days)
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentSessions = commitments.filter((c) => c.timestamp > sevenDaysAgo).length;

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <header className="border-b border-separator bg-canvas/95 backdrop-blur-lg sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/for-campuses")}
                className="flex items-center gap-1 text-sm text-label-tertiary hover:text-label-secondary transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <div>
                <h1 className="text-lg font-semibold text-label-primary">
                  {institution.name}
                </h1>
                <p className="text-sm text-label-primary0">PsychTrails Staff Dashboard</p>
              </div>
            </div>
            <button
              onClick={loadData}
              className="flex items-center gap-2 rounded-lg border border-separator bg-surface-grouped px-3 py-2 text-sm font-medium text-label-secondary hover:bg-fill-secondary transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Demo banner */}
        <div className="mb-6 rounded-xl border border-caution-700/30 bg-caution-tint p-4">
          <p className="text-sm text-caution-700">
            <strong>Demo Mode:</strong> This dashboard shows data from your browser's local storage.
            In a real deployment, this would connect to your institution's secure backend.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Users}
            label="Practice Sessions"
            value={totalSessions}
            subtext={`${recentSessions} in last 7 days`}
          />
          <StatCard
            icon={MessageCircle}
            label="Follow-up Requests"
            value={pendingFollowUps}
            subtext="Pending outreach"
          />
          <StatCard
            icon={TrendingUp}
            label="Commit Rate"
            value={`${commitRate}%`}
            subtext="Selected 'I'll try tomorrow'"
          />
          <StatCard
            icon={CheckCircle}
            label="Seeking Support"
            value={`${talkToSomeoneRate}%`}
            subtext="Want to talk to someone"
          />
        </div>

        {/* Follow-up requests */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-label-primary mb-4">
            Follow-up Requests
          </h2>

          {pendingFollowUps === 0 ? (
            <div className="rounded-xl border border-separator bg-surface-grouped p-8 text-center">
              <MessageCircle className="h-8 w-8 text-label-quaternary mx-auto mb-3" />
              <p className="text-label-tertiary">No follow-up requests yet</p>
              <p className="text-sm text-label-primary0 mt-1">
                Students can opt-in to staff follow-up after completing a scenario
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {followUpRequests
                .filter((r) => !r.resolved)
                .map((request) => (
                  <FollowUpCard key={request.id} request={request} />
                ))}
            </div>
          )}
        </section>

        {/* Recent activity */}
        <section>
          <h2 className="text-lg font-semibold text-label-primary mb-4">
            Recent Activity (Anonymous)
          </h2>

          {commitments.length === 0 ? (
            <div className="rounded-xl border border-separator bg-surface-grouped p-8 text-center">
              <Clock className="h-8 w-8 text-label-quaternary mx-auto mb-3" />
              <p className="text-label-tertiary">No activity yet</p>
              <p className="text-sm text-label-primary0 mt-1">
                Anonymous practice data will appear here
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-separator bg-surface-grouped overflow-hidden">
              <table className="w-full">
                <thead className="bg-surface border-b border-separator">
                  <tr>
                    <th className="text-left text-xs font-medium text-label-primary0 uppercase tracking-wide px-4 py-3">
                      Time
                    </th>
                    <th className="text-left text-xs font-medium text-label-primary0 uppercase tracking-wide px-4 py-3">
                      Scenario
                    </th>
                    <th className="text-left text-xs font-medium text-label-primary0 uppercase tracking-wide px-4 py-3">
                      Outcome
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-separator">
                  {commitments.slice(-10).reverse().map((commitment, i) => (
                    <tr key={i} className="hover:bg-fill-secondary/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-label-tertiary">
                        {getTimeAgo(commitment.timestamp)}
                      </td>
                      <td className="px-4 py-3 text-sm text-label-secondary">
                        {commitment.scenarioId.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium border ${
                            commitment.selectedAction === "commit_24h"
                              ? "bg-positive-tint text-positive-600 border-positive-700/30"
                              : commitment.selectedAction === "talk_to_someone"
                                ? "bg-accent-tint text-accent border-accent-700/30"
                                : commitment.selectedAction === "smaller_step"
                                  ? "bg-blue-900/30 text-blue-400 border-blue-700/30"
                                  : "bg-surface-grouped text-label-tertiary border-separator"
                          }`}
                        >
                          {commitment.selectedAction === "commit_24h"
                            ? "Committed"
                            : commitment.selectedAction === "talk_to_someone"
                              ? "Seeking support"
                              : commitment.selectedAction === "smaller_step"
                                ? "Smaller step"
                                : "Practicing"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Privacy reminder */}
        <div className="mt-8 rounded-xl border border-separator bg-surface-grouped p-4">
          <p className="text-xs text-label-primary0">
            <strong className="text-label-tertiary">Privacy note:</strong> This dashboard only shows students who explicitly opted into follow-up.
            All other activity is anonymous—you see aggregate patterns, not individual choices.
          </p>
        </div>
      </main>
    </div>
  );
}
