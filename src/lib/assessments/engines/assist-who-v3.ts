// src/lib/assessments/engines/assist-who-v3.ts

export function compute(data: any, answers: Record<string, any>) {
  console.log("ASSIST engine called with answers:", Object.keys(answers).length, "items");
  console.log("First few answers:", { q1: answers.q1, q2: answers.q2, q60: answers.q60 });
  const rules = data.scoring?.rules || {};
  const substanceMapping = rules.substance_mapping || {};
  const riskThresholds = rules.risk_thresholds || {};
  const injectionQuestion = rules.injection_question || "q60";

  // Helper function to get answer value
  const getAnswer = (questionId: string) => {
    return answers[questionId] || 0;
  };

  // Calculate substance-specific involvement scores using exact WHO methodology
  const substanceResults: Record<string, any> = {};
  const substanceScores: Record<string, number> = {};
  const substanceRisks: Record<string, string> = {};

  let highestRisk = "Low Risk";
  let totalSubstancesWithModerateOrHighRisk = 0;
  const substancesWithAnyUse: string[] = [];

  Object.entries(substanceMapping).forEach(([substance, questionMapping]: [string, any]) => {
    // Calculate substance involvement score following WHO ASSIST v3.0 methodology
    // Score = Q2 + Q3 + Q4 + Q5 (if applicable) + Q6 + Q7
    let score = 0;

    // Q2 equivalent (frequency in past 3 months) - values: 0, 2, 3, 4, 6
    const frequencyScore = getAnswer(questionMapping.frequency);
    score += frequencyScore;

    // Track substances with any use for reporting
    if (frequencyScore > 0) {
      substancesWithAnyUse.push(substance);
    }

    // Q3 equivalent (strong desire/urge) - values: 0, 3, 4, 5, 6
    score += getAnswer(questionMapping.desire);

    // Q4 equivalent (health/social/legal/financial problems) - values: 0, 4, 5, 6, 7
    score += getAnswer(questionMapping.problems);

    // Q5 equivalent (failed to do what was expected) - values: 0, 5, 6, 7, 8
    // NOTE: Tobacco does not include Q5 in scoring per WHO specification
    if (questionMapping.failure && substance !== "tobacco") {
      score += getAnswer(questionMapping.failure);
    }

    // Q6 equivalent (others expressed concern) - values: 0, 3, 6
    score += getAnswer(questionMapping.concern);

    // Q7 equivalent (tried and failed to control/cut down/stop) - values: 0, 3, 6
    score += getAnswer(questionMapping.control);

    // Determine risk level based on WHO thresholds
    const thresholds = riskThresholds[substance] || {
      low: [0, 3],
      moderate: [4, 26],
      high: [27, 999],
    };
    let risk = "Low Risk";

    if (score >= thresholds.high[0]) {
      risk = "High Risk";
      if (highestRisk !== "High Risk") highestRisk = "High Risk";
      totalSubstancesWithModerateOrHighRisk++;
    } else if (score >= thresholds.moderate[0]) {
      risk = "Moderate Risk";
      if (highestRisk === "Low Risk") highestRisk = "Moderate Risk";
      totalSubstancesWithModerateOrHighRisk++;
    }

    substanceResults[substance] = {
      assessed: true,
      score: score,
      risk: risk,
      frequency_score: frequencyScore,
      used_in_past_3_months: frequencyScore > 0,
      threshold_low: thresholds.low,
      threshold_moderate: thresholds.moderate,
      threshold_high: thresholds.high,
    };

    substanceScores[substance] = score;
    substanceRisks[substance] = risk;
  });

  // Handle injection drug use (Q8) - values: 0, 1, 2
  const injectionDrugUse = getAnswer(injectionQuestion);
  const injectionHistory =
    injectionDrugUse === 0
      ? "Never"
      : injectionDrugUse === 1
        ? "Yes, but not in past 3 months"
        : injectionDrugUse === 2
          ? "Yes, in past 3 months"
          : "Not assessed";

  // Injection drug use risk assessment
  let injectionRisk = "No Risk";
  if (injectionDrugUse === 2) {
    injectionRisk = "High Risk";
    // Recent injection drug use is high risk regardless of substance scores
  } else if (injectionDrugUse === 1) {
    injectionRisk = "Moderate Risk";
  }

  // Generate clinical alerts and recommendations
  const alerts: string[] = [];
  const recommendations: string[] = [];

  // Substance-specific alerts
  Object.entries(substanceResults).forEach(([substance, result]: [string, any]) => {
    if (result.risk !== "Low Risk") {
      alerts.push(`${capitalizeFirst(substance)}: ${result.risk} (Score: ${result.score})`);

      if (result.risk === "High Risk") {
        recommendations.push(
          `${capitalizeFirst(substance)}: Further assessment and more intensive treatment recommended`
        );
      } else if (result.risk === "Moderate Risk") {
        recommendations.push(`${capitalizeFirst(substance)}: Brief intervention recommended`);
      }
    }
  });

  // Injection drug use alerts
  if (injectionDrugUse > 0) {
    alerts.push(`Injection Drug Use: ${injectionHistory}`);
    if (injectionDrugUse === 2) {
      recommendations.push(
        "Injection Drug Use: Immediate assessment for injection-related risks and harm reduction services"
      );
    } else if (injectionDrugUse === 1) {
      recommendations.push(
        "Injection Drug Use History: Consider assessment for blood-borne virus testing and ongoing risk"
      );
    }
  }

  // Calculate summary statistics
  const totalSubstancesUsed = substancesWithAnyUse.length;
  const highestSubstanceScore = Math.max(...Object.values(substanceScores), 0);

  // Calculate dynamic max based on highest scoring substance
  const tobaccoScore = substanceScores.tobacco || 0;
  const maxPossible = highestSubstanceScore === tobaccoScore ? 31 : 39;

  return {
    score: highestSubstanceScore, // Highest individual substance score
    max: maxPossible, // Dynamic max: 31 for tobacco, 39 for other substances
    details: {
      // Overall WHO ASSIST assessment
      highest_risk: highestRisk,
      substances_used: substancesWithAnyUse.join(", ") || "None reported",
      total_substances_used: totalSubstancesUsed,
      moderate_or_high_risk_count: totalSubstancesWithModerateOrHighRisk,
      highest_substance_score: highestSubstanceScore,

      // Injection drug use assessment
      injection_history: injectionHistory,
      injection_risk: injectionRisk,
      injection_score: injectionDrugUse,

      // Individual substance results
      ...Object.fromEntries(
        Object.keys(substanceMapping).map((substance: string) => [
          `${substance}_assessed`,
          substanceResults[substance].assessed,
        ])
      ),
      ...Object.fromEntries(
        Object.keys(substanceMapping).map((substance: string) => [
          `${substance}_score`,
          substanceResults[substance].score,
        ])
      ),
      ...Object.fromEntries(
        Object.keys(substanceMapping).map((substance: string) => [
          `${substance}_risk`,
          substanceResults[substance].risk,
        ])
      ),

      // Clinical interpretation for renderer compatibility
      band: highestRisk,
      clinical_interpretation: getWHOInterpretation(
        highestRisk,
        injectionRisk,
        totalSubstancesWithModerateOrHighRisk
      ),
      alerts: alerts,
      recommendations: recommendations,

      // Detailed substance breakdown for clinical use
      substance_details: substanceResults,
    },
  };

  // Helper function to capitalize first letter
  function capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Helper function to provide WHO-aligned clinical interpretation
  function getWHOInterpretation(
    highestRisk: string,
    injectionRisk: string,
    substanceCount: number
  ): string {
    if (injectionRisk === "High Risk") {
      return "High risk profile with recent injection drug use. Immediate comprehensive assessment, harm reduction, and specialist treatment services required.";
    } else if (highestRisk === "High Risk") {
      return `High risk substance involvement detected${substanceCount > 1 ? " across multiple substances" : ""}. Further assessment and more intensive treatment including specialist services is recommended.`;
    } else if (highestRisk === "Moderate Risk") {
      return `Moderate risk substance involvement${substanceCount > 1 ? " patterns" : ""}. Brief intervention including structured advice, self-help materials, and follow-up within 1-3 months is recommended.`;
    } else if (injectionRisk === "Moderate Risk") {
      return "History of injection drug use warrants ongoing assessment for blood-borne virus risk and treatment planning despite low current substance scores.";
    } else {
      return "Low risk substance use pattern. Brief advice and routine monitoring during health visits is appropriate.";
    }
  }
}
