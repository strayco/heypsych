/**
 * NextStepCard Component Tests
 *
 * Tests for the Navigation V1 contextual next step card.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { NextStepCard } from "../NextStepCard";
import type { NextStep } from "@/domains/navigation/types";

// Mock the analytics module
vi.mock("@/lib/analytics/product-events", () => ({
  trackNextStepClick: vi.fn(),
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

describe("NextStepCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockStep = (overrides?: Partial<NextStep>): NextStep => ({
    id: "test-step-1",
    kind: "treatment",
    title: "Learn about CBT",
    description: "Cognitive Behavioral Therapy is an effective treatment",
    href: "/treatments/cognitive-behavioral-therapy",
    audience: "patient",
    reason: "First-line treatment for this condition",
    priority: 1,
    source: "editorial",
    ...overrides,
  });

  it("renders step title and description", () => {
    const step = createMockStep();
    render(<NextStepCard step={step} />);

    expect(screen.getByText("Learn about CBT")).toBeInTheDocument();
    expect(
      screen.getByText("Cognitive Behavioral Therapy is an effective treatment")
    ).toBeInTheDocument();
  });

  it("renders reason when provided", () => {
    const step = createMockStep();
    render(<NextStepCard step={step} />);

    expect(screen.getByText("First-line treatment for this condition")).toBeInTheDocument();
  });

  it("renders as internal link for non-external steps", () => {
    const step = createMockStep();
    render(<NextStepCard step={step} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/treatments/cognitive-behavioral-therapy");
    expect(link).not.toHaveAttribute("target", "_blank");
  });

  it("renders as external link when kind is external", () => {
    const step = createMockStep({
      kind: "external",
      href: "https://example.com/resource",
    });
    render(<NextStepCard step={step} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com/resource");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders as external link when href starts with http", () => {
    const step = createMockStep({
      href: "https://external-resource.com/article",
    });
    render(<NextStepCard step={step} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("tracks click with analytics", async () => {
    const { trackNextStepClick } = await import("@/lib/analytics/product-events");
    const step = createMockStep();

    render(
      <NextStepCard
        step={step}
        sourceType="condition"
        sourceSlug="obsessive-compulsive-disorder"
      />
    );

    fireEvent.click(screen.getByRole("link"));

    expect(trackNextStepClick).toHaveBeenCalledWith(
      "test-step-1",
      "treatment",
      "Learn about CBT",
      "condition",
      "obsessive-compulsive-disorder"
    );
  });

  it("uses fallback values when source context not provided", async () => {
    const { trackNextStepClick } = await import("@/lib/analytics/product-events");
    const step = createMockStep();

    render(<NextStepCard step={step} />);

    fireEvent.click(screen.getByRole("link"));

    expect(trackNextStepClick).toHaveBeenCalledWith(
      "test-step-1",
      "treatment",
      "Learn about CBT",
      "unknown",
      "unknown"
    );
  });

  it("handles step without description", () => {
    const step = createMockStep({ description: undefined });
    render(<NextStepCard step={step} />);

    expect(screen.getByText("Learn about CBT")).toBeInTheDocument();
    // No description should be rendered
    expect(
      screen.queryByText("Cognitive Behavioral Therapy is an effective treatment")
    ).not.toBeInTheDocument();
  });

  it("handles step without reason", () => {
    const step = createMockStep({ reason: undefined });
    render(<NextStepCard step={step} />);

    expect(screen.getByText("Learn about CBT")).toBeInTheDocument();
    expect(
      screen.queryByText("First-line treatment for this condition")
    ).not.toBeInTheDocument();
  });

  it("renders different icons for different step kinds", () => {
    const kinds: Array<NextStep["kind"]> = [
      "assessment",
      "condition",
      "treatment",
      "comparison",
      "tool",
      "find_care",
      "clinician_resource",
      "article",
      "external",
    ];

    kinds.forEach((kind) => {
      const step = createMockStep({ kind, id: `step-${kind}` });
      const { unmount } = render(<NextStepCard step={step} />);
      // Just verify it renders without error
      expect(screen.getByText("Learn about CBT")).toBeInTheDocument();
      unmount();
    });
  });
});
