/**
 * Markdown API Route for Conditions
 *
 * Provides clean Markdown format for LLM ingestion.
 * Lower token cost and faster processing than HTML.
 *
 * Usage: GET /api/markdown/conditions/major-depressive-disorder
 */

import { NextRequest, NextResponse } from 'next/server';
import { EntityService } from '@/lib/data/entity-service';
import { conditionToMarkdown } from '@/lib/content/markdown-converter';
import { maybeTrackAIBot } from '@/lib/analytics/ai-telemetry';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Track AI bot access for telemetry (AI Share of Voice metrics)
    maybeTrackAIBot(request, 'markdown');

    const { slug } = await params;

    // Fetch entity from database
    const entity = await EntityService.getBySlug(slug);

    if (!entity || entity.type !== 'condition') {
      return new NextResponse('Condition not found', { status: 404 });
    }

    // Convert to Markdown
    const markdown = conditionToMarkdown(entity);

    // Freshness signal for LLMs (especially Gemini which prioritizes recent content)
    // Use editorial last reviewed date if available, otherwise entity updated_at
    const lastModified = entity.editorial?.dates?.lastMedicallyReviewed
      || entity.metadata?.last_updated
      || entity.updated_at;

    const lastModifiedDate = new Date(lastModified);
    const lastModifiedHeader = lastModifiedDate.toUTCString();

    // Return Markdown with proper headers
    return new NextResponse(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400', // 24 hour cache
        'Last-Modified': lastModifiedHeader, // Freshness signal for Gemini
        'X-Content-Format': 'markdown',
        'X-Optimized-For': 'LLM-Ingestion',
        // CORS headers for AI agents (Perplexity, Claude-Web, custom medical GPTs)
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, User-Agent',
      },
    });
  } catch (error) {
    console.error('Error generating condition markdown:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Enable static generation for common conditions
export async function generateStaticParams() {
  // Only pre-generate top conditions for Markdown format
  // Others will be generated on-demand
  const topConditions = [
    'major-depressive-disorder',
    'generalized-anxiety-disorder',
    'post-traumatic-stress-disorder',
    'bipolar-disorder',
    'attention-deficit-hyperactivity-disorder',
    'obsessive-compulsive-disorder',
    'panic-disorder',
    'social-anxiety-disorder',
  ];

  return topConditions.map((slug) => ({ slug }));
}

export const revalidate = 86400; // 24 hours
