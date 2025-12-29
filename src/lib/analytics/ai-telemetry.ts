/**
 * AI-Grounding Telemetry
 *
 * Tracks "Retrieval Events" - when AI bots (Gemini, GPT, Claude, Perplexity)
 * access our content for training or grounding purposes.
 *
 * This enables tracking of "AI Share of Voice" and proving AI SEO ROI.
 */

interface AIRetrievalEvent {
  timestamp: string;
  userAgent: string;
  botType: 'Google-Extended' | 'GPTBot' | 'anthropic-ai' | 'PerplexityBot' | 'Claude-Web' | 'other';
  contentType: 'html' | 'markdown' | 'llms.txt';
  path: string;
  slug?: string;
  entityType?: 'condition' | 'treatment' | 'resource';
}

/**
 * Detect AI bot from User-Agent string
 */
export function detectAIBot(userAgent: string): AIRetrievalEvent['botType'] | null {
  const ua = userAgent.toLowerCase();

  // Google Extended (Gemini training/grounding)
  if (ua.includes('google-extended')) {
    return 'Google-Extended';
  }

  // OpenAI GPT Bot
  if (ua.includes('gptbot') || ua.includes('chatgpt')) {
    return 'GPTBot';
  }

  // Anthropic Claude
  if (ua.includes('anthropic-ai') || ua.includes('claude-web')) {
    return 'Claude-Web';
  }

  // Perplexity
  if (ua.includes('perplexitybot') || ua.includes('perplexity')) {
    return 'PerplexityBot';
  }

  // Other potential AI bots
  if (
    ua.includes('bingbot') ||
    ua.includes('msnbot') ||
    ua.includes('bard') ||
    ua.includes('gemini')
  ) {
    return 'other';
  }

  return null;
}

/**
 * Log AI retrieval event
 *
 * In production, this should send to your analytics service (GA4, Mixpanel, etc.)
 * For now, we log to console in dev and could extend to a database or log file
 */
export function logAIRetrievalEvent(event: AIRetrievalEvent): void {
  // Console log for development visibility
  if (process.env.NODE_ENV === 'development') {
    console.log('🤖 AI Retrieval Event:', {
      bot: event.botType,
      content: event.contentType,
      path: event.path,
    });
  }

  // In production, send to analytics
  // Example: Send to GA4 as custom event
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'ai_retrieval', {
      event_category: 'AI Bots',
      event_label: event.botType,
      content_type: event.contentType,
      content_path: event.path,
      entity_type: event.entityType,
      bot_type: event.botType,
    });
  }

  // Example: Send to server-side analytics endpoint
  // In production, you might want to batch these or send to a queue
  if (process.env.NODE_ENV === 'production') {
    // Could send to /api/analytics/ai-retrieval endpoint
    // Or use a service like LogRocket, Mixpanel, Amplitude, etc.
    try {
      fetch('/api/analytics/ai-retrieval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      }).catch(() => {
        // Fail silently - don't block the main request
      });
    } catch {
      // Fail silently
    }
  }
}

/**
 * Track AI bot request in middleware or API route
 *
 * Usage in API route:
 * ```ts
 * const botType = detectAIBot(request.headers.get('user-agent') || '');
 * if (botType) {
 *   trackAIBotRequest(request, botType, 'markdown');
 * }
 * ```
 */
export function trackAIBotRequest(
  request: Request,
  botType: NonNullable<ReturnType<typeof detectAIBot>>,
  contentType: AIRetrievalEvent['contentType']
): void {
  const url = new URL(request.url);
  const path = url.pathname;

  // Extract entity info from path
  let entityType: AIRetrievalEvent['entityType'] | undefined;
  let slug: string | undefined;

  if (path.includes('/conditions/')) {
    entityType = 'condition';
    slug = path.split('/conditions/')[1]?.split('/')[0];
  } else if (path.includes('/treatments/')) {
    entityType = 'treatment';
    slug = path.split('/treatments/')[1]?.split('/')[0];
  } else if (path.includes('/resources/')) {
    entityType = 'resource';
    slug = path.split('/resources/')[1]?.split('/')[0];
  }

  const event: AIRetrievalEvent = {
    timestamp: new Date().toISOString(),
    userAgent: request.headers.get('user-agent') || 'unknown',
    botType,
    contentType,
    path,
    slug,
    entityType,
  };

  logAIRetrievalEvent(event);
}

/**
 * Middleware helper to track AI bots
 *
 * Call this in middleware.ts to track all AI bot requests
 */
export function maybeTrackAIBot(request: Request, contentType: AIRetrievalEvent['contentType']): void {
  const userAgent = request.headers.get('user-agent') || '';
  const botType = detectAIBot(userAgent);

  if (botType) {
    trackAIBotRequest(request, botType, contentType);
  }
}
