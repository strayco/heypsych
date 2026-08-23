// src/lib/notifications/demo-request-notifier.ts
// Notification service for demo request leads
// Sends internal notification to HeyPsych team when a demo request is submitted

import type { DemoRequest } from "@/lib/tools/demo-request";

// ============================================================================
// TYPES
// ============================================================================

export interface NotificationResult {
  success: boolean;
  channel: "email" | "webhook" | "none";
  error?: string;
}

export interface DualNotificationResult {
  operator: NotificationResult;
  buyer: NotificationResult;
}

// ============================================================================
// ENVIRONMENT CONFIGURATION
// ============================================================================

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFICATION_EMAIL = process.env.DEMO_NOTIFICATION_EMAIL || "team@heypsych.com";
const SLACK_WEBHOOK_URL = process.env.SLACK_DEMO_WEBHOOK_URL;

// ============================================================================
// EMAIL NOTIFICATION (RESEND)
// ============================================================================

async function sendEmailNotification(
  data: DemoRequest,
  requestId: string
): Promise<NotificationResult> {
  if (!RESEND_API_KEY) {
    console.warn("[Notification] RESEND_API_KEY not configured, skipping email");
    return { success: false, channel: "email", error: "API key not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "HeyPsych Leads <leads@heypsych.com>",
        to: [NOTIFICATION_EMAIL],
        subject: `🎯 New Demo Request: ${data.toolName}`,
        html: formatEmailHtml(data, requestId),
        text: formatEmailText(data, requestId),
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[Notification] Resend API error:", response.status, errorBody);
      return { success: false, channel: "email", error: `Resend API: ${response.status}` };
    }

    console.log("[Notification] Email sent successfully for request:", requestId);
    return { success: true, channel: "email" };
  } catch (error) {
    console.error("[Notification] Failed to send email:", error);
    return {
      success: false,
      channel: "email",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function formatEmailHtml(data: DemoRequest, requestId: string): string {
  const practiceInfo = data.practiceName
    ? `<p><strong>Practice:</strong> ${data.practiceName}</p>`
    : "";

  const messageSection = data.message
    ? `<h3>Message from Lead:</h3><p style="background: #f5f5f5; padding: 12px; border-radius: 4px;">${data.message}</p>`
    : "";

  const utmInfo =
    data.utmSource || data.utmMedium || data.utmCampaign
      ? `<p style="color: #666; font-size: 12px;">UTM: ${data.utmSource || "-"} / ${data.utmMedium || "-"} / ${data.utmCampaign || "-"}</p>`
      : "";

  return `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">New Demo Request for ${data.toolName}</h2>

      <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h3 style="margin-top: 0;">Contact Information</h3>
        <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
        <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
        ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ""}
        ${practiceInfo}
      </div>

      <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h3 style="margin-top: 0;">Practice Details</h3>
        <p><strong>Role:</strong> ${formatRole(data.role)}</p>
        <p><strong>Practice Size:</strong> ${formatPracticeSize(data.practiceSize)}</p>
        <p><strong>Practice Setting:</strong> ${formatPracticeSetting(data.practiceSetting)}</p>
        ${data.timeline ? `<p><strong>Timeline:</strong> ${data.timeline}</p>` : ""}
      </div>

      ${messageSection}

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <p style="color: #666; font-size: 14px;">
          <strong>Request ID:</strong> ${requestId}<br/>
          <strong>Tool:</strong> ${data.toolName} (${data.toolSlug})<br/>
          <strong>Source:</strong> ${data.matcherSource ? "EHR Matcher" : "Direct"}<br/>
          <strong>Marketing Consent:</strong> ${data.marketingConsent ? "Yes" : "No"}
        </p>
        ${utmInfo}
      </div>

    </div>
  `;
}

function formatEmailText(data: DemoRequest, requestId: string): string {
  return `
New Demo Request for ${data.toolName}

CONTACT INFORMATION
-------------------
Name: ${data.firstName} ${data.lastName}
Email: ${data.email}
${data.phone ? `Phone: ${data.phone}` : ""}
${data.practiceName ? `Practice: ${data.practiceName}` : ""}

PRACTICE DETAILS
----------------
Role: ${formatRole(data.role)}
Practice Size: ${formatPracticeSize(data.practiceSize)}
Practice Setting: ${formatPracticeSetting(data.practiceSetting)}
${data.timeline ? `Timeline: ${data.timeline}` : ""}

${data.message ? `MESSAGE FROM LEAD\n-----------------\n${data.message}\n` : ""}

REQUEST DETAILS
---------------
Request ID: ${requestId}
Tool: ${data.toolName} (${data.toolSlug})
Source: ${data.matcherSource ? "EHR Matcher" : "Direct"}
Marketing Consent: ${data.marketingConsent ? "Yes" : "No"}
  `.trim();
}

// ============================================================================
// SLACK WEBHOOK NOTIFICATION (BACKUP)
// ============================================================================

async function sendSlackNotification(
  data: DemoRequest,
  requestId: string
): Promise<NotificationResult> {
  if (!SLACK_WEBHOOK_URL) {
    return { success: false, channel: "webhook", error: "Webhook not configured" };
  }

  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `🎯 New Demo Request: *${data.toolName}*`,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `🎯 New Demo Request: ${data.toolName}`,
            },
          },
          {
            type: "section",
            fields: [
              { type: "mrkdwn", text: `*Name:*\n${data.firstName} ${data.lastName}` },
              { type: "mrkdwn", text: `*Email:*\n${data.email}` },
              { type: "mrkdwn", text: `*Role:*\n${formatRole(data.role)}` },
              { type: "mrkdwn", text: `*Practice Size:*\n${formatPracticeSize(data.practiceSize)}` },
            ],
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `Source: ${data.matcherSource ? "EHR Matcher" : "Direct"} | ID: ${requestId}`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      return { success: false, channel: "webhook", error: `Slack: ${response.status}` };
    }

    console.log("[Notification] Slack notification sent for request:", requestId);
    return { success: true, channel: "webhook" };
  } catch (error) {
    console.error("[Notification] Failed to send Slack notification:", error);
    return {
      success: false,
      channel: "webhook",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    psychiatrist: "Psychiatrist",
    psychologist: "Psychologist",
    therapist: "Therapist/Counselor",
    "psychiatric-np": "Psychiatric NP",
    "practice-manager": "Practice Manager",
    other: "Other",
  };
  return roleMap[role] || role;
}

function formatPracticeSize(size: string): string {
  const sizeMap: Record<string, string> = {
    solo: "Solo Practice",
    small: "Small (2-5 providers)",
    medium: "Medium (6-20 providers)",
    large: "Large (21+ providers)",
  };
  return sizeMap[size] || size;
}

function formatPracticeSetting(setting: string): string {
  const settingMap: Record<string, string> = {
    "private-practice": "Private Practice",
    "group-practice": "Group Practice",
    clinic: "Clinic/Health Center",
    hospital: "Hospital/Health System",
    telehealth: "Telehealth Only",
    other: "Other",
  };
  return settingMap[setting] || setting;
}

// ============================================================================
// BUYER CONFIRMATION EMAIL
// ============================================================================

/**
 * Send confirmation email to the person who submitted the demo request
 */
async function sendBuyerConfirmation(
  data: DemoRequest,
  requestId: string
): Promise<NotificationResult> {
  if (!RESEND_API_KEY) {
    console.warn("[Notification] RESEND_API_KEY not configured, skipping buyer confirmation");
    return { success: false, channel: "email", error: "API key not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "HeyPsych <hello@heypsych.com>",
        to: [data.email],
        subject: `Your demo request for ${data.toolName} has been received`,
        html: formatBuyerConfirmationHtml(data, requestId),
        text: formatBuyerConfirmationText(data, requestId),
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[Notification] Buyer confirmation error:", response.status, errorBody);
      return { success: false, channel: "email", error: `Resend API: ${response.status}` };
    }

    console.log("[Notification] Buyer confirmation sent for request:", requestId);
    return { success: true, channel: "email" };
  } catch (error) {
    console.error("[Notification] Failed to send buyer confirmation:", error);
    return {
      success: false,
      channel: "email",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function formatBuyerConfirmationHtml(data: DemoRequest, requestId: string): string {
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">Thanks for your interest in ${data.toolName}</h2>

      <p>Hi ${data.firstName},</p>

      <p>We've received your demo request and a member of our team will be in touch within 1 business day.</p>

      <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h3 style="margin-top: 0;">What you requested:</h3>
        <p><strong>Tool:</strong> ${data.toolName}</p>
        ${data.message ? `<p><strong>Your message:</strong> ${data.message}</p>` : ""}
      </div>

      <p>In the meantime, you can:</p>
      <ul>
        <li><a href="https://heypsych.com/tools/for-clinicians/ehr-practice-management/${data.toolSlug}/">Learn more about ${data.toolName}</a></li>
        <li><a href="https://heypsych.com/tools/for-clinicians/">Browse other clinician tools</a></li>
      </ul>

      <p style="color: #666; font-size: 14px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        Reference: ${requestId}<br/>
        If you have questions, reply to this email or contact us at hello@heypsych.com
      </p>
    </div>
  `;
}

function formatBuyerConfirmationText(data: DemoRequest, requestId: string): string {
  return `
Thanks for your interest in ${data.toolName}

Hi ${data.firstName},

We've received your demo request and a member of our team will be in touch within 1 business day.

What you requested:
- Tool: ${data.toolName}
${data.message ? `- Your message: ${data.message}` : ""}

In the meantime, you can learn more at:
https://heypsych.com/tools/for-clinicians/ehr-practice-management/${data.toolSlug}/

Reference: ${requestId}
If you have questions, reply to this email or contact us at hello@heypsych.com
  `.trim();
}

// ============================================================================
// MAIN NOTIFICATION FUNCTION
// ============================================================================

/**
 * Send notification for a new demo request to operator only (legacy).
 * Tries email first (Resend), falls back to Slack webhook.
 * Returns success if at least one channel succeeds.
 *
 * @deprecated Use notifyDemoRequestDual for both operator and buyer notifications
 */
export async function notifyDemoRequest(
  data: DemoRequest,
  requestId: string
): Promise<NotificationResult> {
  // Try email first (preferred)
  const emailResult = await sendEmailNotification(data, requestId);
  if (emailResult.success) {
    return emailResult;
  }

  // Fall back to Slack
  const slackResult = await sendSlackNotification(data, requestId);
  if (slackResult.success) {
    return slackResult;
  }

  // No notification channel configured or all failed
  if (!RESEND_API_KEY && !SLACK_WEBHOOK_URL) {
    console.warn(
      "[Notification] No notification channels configured. Set RESEND_API_KEY or SLACK_DEMO_WEBHOOK_URL"
    );
    return { success: false, channel: "none", error: "No channels configured" };
  }

  // At least one was configured but both failed
  console.error("[Notification] All notification channels failed for request:", requestId);
  return {
    success: false,
    channel: "none",
    error: `Email: ${emailResult.error}; Slack: ${slackResult.error}`,
  };
}

/**
 * Send both operator and buyer notifications for a demo request.
 *
 * - Operator: Internal team notification via email (with Slack fallback)
 * - Buyer: Confirmation email to the person who submitted the request
 *
 * This function never throws - notification failures are logged but don't
 * prevent the demo request from being processed successfully.
 */
export async function notifyDemoRequestDual(
  data: DemoRequest,
  requestId: string
): Promise<DualNotificationResult> {
  // Send both notifications in parallel
  const [operatorResult, buyerResult] = await Promise.all([
    notifyDemoRequest(data, requestId),
    sendBuyerConfirmation(data, requestId),
  ]);

  return {
    operator: operatorResult,
    buyer: buyerResult,
  };
}
