// @vitest-environment happy-dom
/**
 * IntentGrid Component Tests
 *
 * Tests for the Navigation V1 intent-based navigation grid.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { IntentGrid, defaultIntents } from "../IntentGrid";

// Mock the analytics module
vi.mock("@/lib/analytics/product-events", () => ({
  trackIntentSelect: vi.fn(),
}));

// Mock next/link using React.createElement to avoid JSX parsing issues
vi.mock("next/link", () => {
  return {
    default: function MockLink({
      children,
      href,
      onClick,
      ...props
    }: {
      children: React.ReactNode;
      href: string;
      onClick?: () => void;
      className?: string;
    }) {
      return React.createElement(
        "a",
        { href, onClick, ...props },
        children
      );
    },
  };
});

describe("IntentGrid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all default intents", () => {
    render(<IntentGrid />);

    // Check that all default intent labels are rendered
    // Note: Clinician intent was moved to AudienceGateway component
    expect(screen.getByText("I'm concerned about symptoms")).toBeInTheDocument();
    expect(screen.getByText("I want to understand a diagnosis")).toBeInTheDocument();
    expect(screen.getByText("I'm comparing treatments")).toBeInTheDocument();
    expect(screen.getByText("I need to find care")).toBeInTheDocument();
    expect(screen.getByText("I'm looking for a mental-health tool")).toBeInTheDocument();
  });

  it("renders custom intents when provided", () => {
    const customIntents = [
      {
        id: "custom_intent",
        label: "Custom Intent",
        description: "A custom navigation intent",
        href: "/custom",
        icon: "search",
        audience: "patient" as const,
      },
    ];

    render(<IntentGrid intents={customIntents} />);

    expect(screen.getByText("Custom Intent")).toBeInTheDocument();
    expect(screen.getByText("A custom navigation intent")).toBeInTheDocument();
    // Should not render default intents
    expect(screen.queryByText("I'm concerned about symptoms")).not.toBeInTheDocument();
  });

  it("renders correct hrefs for navigation", () => {
    render(<IntentGrid />);

    // "concerned about symptoms" goes to /symptoms
    const symptomsLink = screen.getByRole("link", { name: /concerned about symptoms/i });
    expect(symptomsLink).toHaveAttribute("href", "/symptoms");

    // "understand a diagnosis" goes to /conditions
    const diagnosisLink = screen.getByRole("link", { name: /understand a diagnosis/i });
    expect(diagnosisLink).toHaveAttribute("href", "/conditions");

    // "comparing treatments" goes to /treatments/compare
    const treatmentsLink = screen.getByRole("link", { name: /comparing treatments/i });
    expect(treatmentsLink).toHaveAttribute("href", "/treatments/compare");

    const findCareLink = screen.getByRole("link", { name: /find care/i });
    expect(findCareLink).toHaveAttribute("href", "/psychiatrists");
  });

  it("tracks intent selection on click", async () => {
    const { trackIntentSelect } = await import("@/lib/analytics/product-events");
    render(<IntentGrid />);

    const findCareLink = screen.getByRole("link", { name: /find care/i });
    fireEvent.click(findCareLink);

    expect(trackIntentSelect).toHaveBeenCalledWith("find_care");
  });

  it("uses hierarchical layout with primary and secondary sections", () => {
    const { container } = render(<IntentGrid />);

    // Primary intents section uses 2-column grid on sm+
    const primaryGrid = container.querySelector(".grid");
    expect(primaryGrid).toHaveClass("sm:grid-cols-2");

    // Should have separate sections for primary/secondary/clinician
    const sections = container.querySelectorAll(".space-y-6 > *");
    expect(sections.length).toBeGreaterThanOrEqual(2);
  });

  it("does not render clinician section (handled by AudienceGateway)", () => {
    render(<IntentGrid />);

    // Clinician intent is now handled by AudienceGateway, not IntentGrid
    // IntentGrid should only show patient intents
    const clinicianLink = screen.queryByRole("link", { name: /I'm a clinician/i });
    expect(clinicianLink).not.toBeInTheDocument();
  });

  it("exports defaultIntents with all required fields", () => {
    // Note: Clinician intent was moved to AudienceGateway component
    expect(defaultIntents).toHaveLength(5);

    defaultIntents.forEach((intent) => {
      expect(intent).toHaveProperty("id");
      expect(intent).toHaveProperty("label");
      expect(intent).toHaveProperty("description");
      expect(intent).toHaveProperty("href");
      expect(intent).toHaveProperty("icon");
      expect(intent).toHaveProperty("audience");
    });
  });
});
