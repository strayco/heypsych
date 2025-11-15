// src/lib/assessments/engines/sum-with-bands.ts
export function compute(data: any, answers: Record<string, number>) {
  const rules = data.scoring?.rules || {};
  const items = data.items || [];

  // Calculate total score
  const totalRule = rules.total;
  let total = 0;

  if (totalRule?.items && totalRule.method === "sum") {
    total = totalRule.items.reduce((sum: number, itemId: string) => {
      const answer = answers[itemId];
      return sum + (typeof answer === "number" ? answer : 0);
    }, 0);
  }

  // Determine severity band
  const severityRule = rules.severity;
  let severity = "Unknown";

  if (severityRule?.bands && severityRule.input === "total") {
    for (const [range, label] of Object.entries(severityRule.bands)) {
      const [min, max] = range.split("-").map(Number);
      if (!isNaN(min) && !isNaN(max) && total >= min && total <= max) {
        severity = label as string;
        break;
      }
    }
  }

  // Check for alerts
  const alerts = rules.alerts || {};
  const alertMessages: string[] = [];

  for (const [alertKey, alertRule] of Object.entries(alerts)) {
    const rule = alertRule as any;
    if (rule.item && rule.threshold !== undefined) {
      const itemAnswer = answers[rule.item];
      if (typeof itemAnswer === "number" && itemAnswer >= rule.threshold) {
        if (rule.message) {
          alertMessages.push(rule.message);
        }
      }
    }
  }

  // Calculate max possible score
  const maxScore = items.length * 3; // Assuming 0-3 scale for now

  return {
    score: total,
    max: maxScore,
    details: {
      total,
      severity,
      band: severity,
      suicide_alert: alertMessages.length > 0 ? alertMessages.join("; ") : undefined,
      alerts: alertMessages,
    },
  };
}
