// src/lib/assessments/engines/asrs-custom.ts
export function compute(data: any, answers: Record<string, number>) {
  const rules = data.scoring?.rules || {};
  const questions = data.questions || [];

  // Convert question numbers to answer keys
  const getAnswer = (questionNum: number) => {
    const key = `q${questionNum}`;
    return answers[key] || 0;
  };

  // Calculate Part A total (questions 1-6)
  const partA = rules.part_a || [1, 2, 3, 4, 5, 6];
  const partATotal = partA.reduce((sum: number, qNum: number) => sum + getAnswer(qNum), 0);

  // Calculate Part B total (questions 7-18)
  const partB = rules.part_b || [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
  const partBTotal = partB.reduce((sum: number, qNum: number) => sum + getAnswer(qNum), 0);

  // Total score
  const total = partATotal + partBTotal;

  // Part A descriptor and clinical significance
  let partADescriptor = "Low";
  if (partATotal >= 18) partADescriptor = "Very High";
  else if (partATotal >= 14) partADescriptor = "High";
  else if (partATotal >= 10) partADescriptor = "Mild to Moderate";

  // Part B descriptor and clinical significance
  let partBDescriptor = "Low";
  if (partBTotal >= 33) partBDescriptor = "Very High";
  else if (partBTotal >= 27) partBDescriptor = "High";
  else if (partBTotal >= 20) partBDescriptor = "Mild to Moderate";

  // Total descriptor
  let totalDescriptor = "Low";
  if (total >= 50) totalDescriptor = "Very High";
  else if (total >= 40) totalDescriptor = "High";
  else if (total >= 31) totalDescriptor = "Mild to Moderate";

  // Clinical thresholds
  const partAPositive = partATotal >= 14;
  const partBClinicallySignificant = partBTotal >= 27;
  const totalAbove79thPercentile = total >= 40;

  // Calculate domain subscales (Likert totals)
  const domains = rules.domains || {};
  const inattentionItems = domains.inattention || [1, 2, 3, 4, 7, 8, 9, 10, 11];
  const hyperactivityMotorItems = domains.hyperactivity_motor || [5, 6, 12, 13, 14];
  const hyperactivityVerbalItems = domains.hyperactivity_verbal || [15, 16, 17, 18];

  const inattentionTotal = inattentionItems.reduce(
    (sum: number, qNum: number) => sum + getAnswer(qNum),
    0
  );
  const hyperactivityMotorTotal = hyperactivityMotorItems.reduce(
    (sum: number, qNum: number) => sum + getAnswer(qNum),
    0
  );
  const hyperactivityVerbalTotal = hyperactivityVerbalItems.reduce(
    (sum: number, qNum: number) => sum + getAnswer(qNum),
    0
  );

  // Clinical alerts based on multiple criteria - user-friendly language
  const alerts: string[] = [];
  if (partAPositive) {
    alerts.push(
      "Your Part A score indicates a strong likelihood of ADHD - professional evaluation is recommended to confirm diagnosis and discuss treatment options"
    );
  }
  if (partBClinicallySignificant) {
    alerts.push(
      "Your Part B score shows significant additional ADHD symptoms that may impact daily functioning and quality of life"
    );
  }
  if (totalAbove79thPercentile && !partAPositive) {
    alerts.push(
      "Your total score is above the 79th percentile - while your Part A score is below the main threshold, your overall symptom pattern may still warrant professional evaluation"
    );
  }

  // Calculate max scores
  const maxPartA = partA.length * 4;
  const maxPartB = partB.length * 4;
  const maxTotal = maxPartA + maxPartB;

  return {
    score: total,
    max: maxTotal,
    details: {
      // Part A
      part_a_total: partATotal,
      part_a_descriptor: partADescriptor,
      part_a_positive: partAPositive,
      part_a_max: maxPartA,

      // Part B
      part_b_total: partBTotal,
      part_b_descriptor: partBDescriptor,
      part_b_clinically_significant: partBClinicallySignificant,
      part_b_max: maxPartB,

      // Total
      total: total,
      total_descriptor: totalDescriptor,
      total_above_79th_percentile: totalAbove79thPercentile,
      band: totalDescriptor, // For compatibility with renderer

      // Subscales
      sub_inattention: inattentionTotal,
      sub_hyperactivity_motor: hyperactivityMotorTotal,
      sub_hyperactivity_verbal: hyperactivityVerbalTotal,

      // Clinical interpretation
      alerts: alerts,
    },
  };
}
