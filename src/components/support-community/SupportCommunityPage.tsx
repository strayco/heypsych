"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, Shield, Hospital } from "lucide-react";
import type { Resource } from "@/lib/types/support-community";
import type { Hotline } from "@/lib/loaders/support-community-loader";
import { ImmediateCrisisTab } from "./ImmediateCrisisTab";
import { OrganizationsAtoZSection } from "./OrganizationsAtoZSection";
import { TreatmentTab } from "./TreatmentTab";
import { BackToResourcesButton } from "@/components/resources/BackToResourcesButton";

interface Props {
  crisisResources: Resource[];
  organizationsResources: Resource[];
  treatmentResources: Resource[];
  crisisHotlines: Hotline[];
  defaultTab?: TabType;
}

type TabType = "crisis" | "organizations" | "treatment";

/**
 * `?tab=` and `?page=` are read with useSearchParams, which on its own would
 * force every page using this component to render on the server per request.
 * Behind a Suspense boundary the pages stay static: the server HTML is the
 * fallback, which is the full page at its default tab and page 1 (so crisis
 * lines are in the HTML without JavaScript), and the URL-aware version takes
 * over in the browser.
 */
export function SupportCommunityPage(props: Props) {
  return (
    <Suspense fallback={<SupportCommunityView {...props} searchParams={null} />}>
      <SupportCommunityWithParams {...props} />
    </Suspense>
  );
}

function SupportCommunityWithParams(props: Props) {
  const searchParams = useSearchParams();
  return <SupportCommunityView {...props} searchParams={searchParams} />;
}

function SupportCommunityView({
  crisisResources,
  organizationsResources,
  treatmentResources,
  crisisHotlines,
  defaultTab,
  searchParams,
}: Props & { searchParams: URLSearchParams | ReturnType<typeof useSearchParams> | null }) {
  const router = useRouter();
  const initialTab = defaultTab || (searchParams?.get("tab") as TabType) || "crisis";
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const currentPage = parseInt(searchParams?.get("page") || "1", 10);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // Update URL query param
    const params = new URLSearchParams(searchParams?.toString() ?? window.location.search);
    params.set("tab", tab);
    params.delete("page"); // Reset to page 1 when switching tabs
    router.push(`?${params.toString()}`, { scroll: false });

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Analytics
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "tab_change", {
        event_category: "support_community",
        event_label: tab,
      });
    }
  };

  const tabs = [
    {
      id: "crisis" as TabType,
      label: "Immediate & Crisis Help",
      icon: Shield,
      color: "red",
      gradient: "bg-negative",
    },
    {
      id: "organizations" as TabType,
      label: "Organizations & Communities",
      icon: Users,
      color: "blue",
      gradient: "bg-blue-500",
    },
    {
      id: "treatment" as TabType,
      label: "Treatment & Professional Care",
      icon: Hospital,
      color: "green",
      gradient: "bg-green-500",
    },
  ];

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <section className="relative px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 flex justify-center sm:justify-start">
            <BackToResourcesButton />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-center"
          >
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl">
              <span>
                Support & Community
              </span>
            </h1>
            <p className="mx-auto mb-3 max-w-2xl text-sm text-label-primary">
              Find help, connect with others, and access support resources for your mental health journey
            </p>
          </motion.div>

          {/* Tabs */}
          <div className="mb-8">
            <div className="border-b border-separator">
              <nav className="-mb-px flex flex-col gap-2 sm:flex-row sm:gap-0" aria-label="Tabs" role="tablist">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`${tab.id}-panel`}
                      className={`group relative flex-1 border-b-2 px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
                        isActive
                          ? `border-${tab.color}-600 text-${tab.color}-600`
                          : "border-transparent text-label-primary hover:border-separator hover:text-label-primary"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Icon className="h-5 w-5" />
                        <span>{tab.label}</span>
                      </div>
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className={`absolute bottom-0 left-0 right-0 h-0.5 ${tab.gradient}`}
                        />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </section>

      {/* Tab Content */}
      <section className="px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div id="crisis-panel" role="tabpanel" aria-labelledby="crisis-tab" hidden={activeTab !== "crisis"}>
            {activeTab === "crisis" && <ImmediateCrisisTab resources={crisisResources} hotlines={crisisHotlines} page={currentPage} />}
          </div>

          <div id="organizations-panel" role="tabpanel" aria-labelledby="organizations-tab" hidden={activeTab !== "organizations"}>
            {activeTab === "organizations" && <OrganizationsAtoZSection organizations={organizationsResources} page={currentPage} />}
          </div>

          <div id="treatment-panel" role="tabpanel" aria-labelledby="treatment-tab" hidden={activeTab !== "treatment"}>
            {activeTab === "treatment" && <TreatmentTab resources={treatmentResources} page={currentPage} />}
          </div>
        </div>
      </section>
    </div>
  );
}
