// ============================================
// MyLearning - EmailJS Integration Service
// ============================================
// Docs: https://www.emailjs.com/docs/

import emailjs from "@emailjs/browser";

// ============================================
// Configuration
// ============================================

const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "";
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "";

const TEMPLATES = {
  registration: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_REGISTRATION || "",
  payment: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_PAYMENT || "",
  reminder: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_REMINDER || "",
  recording: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_RECORDING || "",
  contactReply: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_CONTACT_REPLY || "",
} as const;

type TemplateType = keyof typeof TEMPLATES;

// ============================================
// Initialization
// ============================================

let isInitialized = false;

function initEmailJS() {
  if (typeof window === "undefined") return; // SSR guard
  if (isInitialized) return;
  if (!EMAILJS_PUBLIC_KEY || EMAILJS_PUBLIC_KEY === "your_public_key") {
    console.warn("[EmailJS] Public key not configured. Emails will be logged but not sent.");
    return;
  }
  emailjs.init(EMAILJS_PUBLIC_KEY);
  isInitialized = true;
}

/**
 * Check if EmailJS is properly configured and ready to send.
 */
export function isEmailConfigured(): boolean {
  return !!(
    EMAILJS_SERVICE_ID &&
    EMAILJS_SERVICE_ID !== "your_service_id" &&
    EMAILJS_PUBLIC_KEY &&
    EMAILJS_PUBLIC_KEY !== "your_public_key"
  );
}

// ============================================
// Core Send Function
// ============================================

interface SendEmailResult {
  success: boolean;
  message: string;
}

/**
 * Send an email via EmailJS. 
 * If EmailJS is not configured, it logs the attempt and returns success (graceful degradation).
 */
async function sendEmail(
  templateType: TemplateType,
  templateParams: Record<string, string>
): Promise<SendEmailResult> {
  initEmailJS();

  const templateId = TEMPLATES[templateType];

  // Graceful degradation: log but don't fail if not configured
  if (!isEmailConfigured() || !templateId || templateId.startsWith("your_")) {
    console.info(`[EmailJS] Skipped (not configured): ${templateType}`, {
      to: templateParams.to_email || templateParams.reply_to,
      subject: templateParams.subject,
    });
    return {
      success: true,
      message: `Email ${templateType} logged (EmailJS not configured)`,
    };
  }

  try {
    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      templateId,
      templateParams
    );

    console.info(`[EmailJS] Sent: ${templateType} → ${templateParams.to_email}`, result.status);
    return {
      success: true,
      message: `Email ${templateType} sent successfully`,
    };
  } catch (error: any) {
    console.error(`[EmailJS] Failed: ${templateType}`, error);
    return {
      success: false,
      message: error?.text || error?.message || "Failed to send email",
    };
  }
}

// ============================================
// Email Template Functions
// ============================================

/**
 * Send registration confirmation email to a user.
 * 
 * EmailJS Template Variables:
 * - {{to_name}} - User's full name
 * - {{to_email}} - User's email
 * - {{event_name}} - Event title
 * - {{event_date}} - Formatted event date
 * - {{event_location}} - Event location
 * - {{event_link}} - Link to event page
 */
export async function sendRegistrationConfirmation(params: {
  userName: string;
  userEmail: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  eventSlug: string;
}): Promise<SendEmailResult> {
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://mylearning.com";

  return sendEmail("registration", {
    to_name: params.userName,
    to_email: params.userEmail,
    event_name: params.eventName,
    event_date: params.eventDate,
    event_location: params.eventLocation,
    event_link: `${siteUrl}/events/${params.eventSlug}`,
    subject: `Konfirmasi Registrasi: ${params.eventName}`,
  });
}

/**
 * Send payment approved email.
 * 
 * EmailJS Template Variables:
 * - {{to_name}}, {{to_email}}, {{event_name}}, {{event_link}}
 */
export async function sendPaymentApproved(params: {
  userName: string;
  userEmail: string;
  eventName: string;
  eventSlug: string;
}): Promise<SendEmailResult> {
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://mylearning.com";

  return sendEmail("payment", {
    to_name: params.userName,
    to_email: params.userEmail,
    event_name: params.eventName,
    event_link: `${siteUrl}/events/${params.eventSlug}`,
    dashboard_link: `${siteUrl}/dashboard/events`,
    subject: `Pembayaran Dikonfirmasi: ${params.eventName}`,
  });
}

/**
 * Send event reminder email (H-1).
 * 
 * EmailJS Template Variables:
 * - {{to_name}}, {{to_email}}, {{event_name}}, {{event_date}}, {{event_link}}
 */
export async function sendEventReminder(params: {
  userName: string;
  userEmail: string;
  eventName: string;
  eventDate: string;
  eventSlug: string;
}): Promise<SendEmailResult> {
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://mylearning.com";

  return sendEmail("reminder", {
    to_name: params.userName,
    to_email: params.userEmail,
    event_name: params.eventName,
    event_date: params.eventDate,
    event_link: `${siteUrl}/events/${params.eventSlug}`,
    subject: `Reminder: ${params.eventName} dimulai besok!`,
  });
}

/**
 * Send recording available notification.
 * 
 * EmailJS Template Variables:
 * - {{to_name}}, {{to_email}}, {{event_name}}, {{recording_link}}
 */
export async function sendRecordingNotification(params: {
  userName: string;
  userEmail: string;
  eventName: string;
  recordingUrl: string;
}): Promise<SendEmailResult> {
  return sendEmail("recording", {
    to_name: params.userName,
    to_email: params.userEmail,
    event_name: params.eventName,
    recording_link: params.recordingUrl,
    subject: `Rekaman Tersedia: ${params.eventName}`,
  });
}

/**
 * Send contact reply email from admin.
 * 
 * EmailJS Template Variables:
 * - {{to_name}}, {{to_email}}, {{original_subject}}, {{reply_message}}
 */
export async function sendContactReply(params: {
  userName: string;
  userEmail: string;
  originalSubject: string;
  replyMessage: string;
}): Promise<SendEmailResult> {
  return sendEmail("contactReply", {
    to_name: params.userName,
    to_email: params.userEmail,
    original_subject: params.originalSubject,
    reply_message: params.replyMessage,
    subject: `Re: ${params.originalSubject}`,
  });
}
