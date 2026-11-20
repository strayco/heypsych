import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ConsensusBadge, ConsensusScore } from "../ConsensusScore";
import { explanationFor, type PublicConsensus } from "@/domains/consensus/public";

const c: PublicConsensus = {
  slug: "simplepractice",
  score: 84,
  confidence: "Moderate",
  updatedAt: "2026-11-20",
  strengths: ["Reviewers often praise the scheduling and client portal."],
  concerns: ["Some reviewers report slow responses from support."],
  sourceNames: ["Capterra", "G2"],
  explanation: explanationFor(["Capterra", "G2"]),
};

describe("Consensus Score display", () => {
  it("shows score /100, confidence, date, strengths, concerns and the explanation", () => {
    const html = renderToStaticMarkup(<ConsensusScore consensus={c} name="SimplePractice" />);
    expect(html).toContain(">84<");
    expect(html).toContain("/100");
    expect(html).toContain("Moderate confidence");
    expect(html).toContain('<time dateTime="2026-11-20">Nov 20, 2026</time>');
    expect(html).toContain("Reviewers often praise the scheduling and client portal.");
    expect(html).toContain("Some reviewers report slow responses from support.");
    expect(html).toContain("Capterra and G2");
    expect(html).toMatch(/not HeyPsych testing/);
    expect(html).toMatch(/does not cover every review online/);
    expect(html).toMatch(/Vendors cannot pay to change it/);
  });

  it("is accessible: a labelled group with a heading and the product name for screen readers", () => {
    const html = renderToStaticMarkup(<ConsensusScore consensus={c} name="SimplePractice" />);
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-labelledby="consensus-simplepractice-title"');
    expect(html).toMatch(/<h3 id="consensus-simplepractice-title"[^>]*>HeyPsych Consensus Score<\/h3>/);
    expect(html).toContain('<span class="sr-only"> for SimplePractice</span>');
    const badge = renderToStaticMarkup(<ConsensusBadge consensus={c} name="SimplePractice" />);
    expect(badge).toContain('aria-label="HeyPsych Consensus Score 84 out of 100 for SimplePractice"');
  });

  it("omits an empty list rather than showing a placeholder", () => {
    const html = renderToStaticMarkup(<ConsensusScore consensus={{ ...c, concerns: [] }} name="SimplePractice" />);
    expect(html).not.toContain("Common concerns");
    expect(html).not.toMatch(/N\/A|placeholder|coming soon/i);
  });
});
