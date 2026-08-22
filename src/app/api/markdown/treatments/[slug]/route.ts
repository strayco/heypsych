/**
 * Markdown API Route for Treatments
 *
 * Provides clean Markdown format for LLM ingestion.
 * Lower token cost and faster processing than HTML.
 *
 * Usage: GET /api/markdown/treatments/cognitive-behavioral-therapy
 */

import { NextRequest, NextResponse } from 'next/server';
import { EntityService } from '@/lib/data/entity-service';
import { treatmentToMarkdown } from '@/lib/content/markdown-converter';
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

    if (!entity || entity.data?.kind !== 'treatment') {
      return new NextResponse('Treatment not found', { status: 404 });
    }

    // Convert to Markdown
    const markdown = treatmentToMarkdown(entity);

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
    console.error('Error generating treatment markdown:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Enable static generation for common treatments
export async function generateStaticParams() {
  // Only pre-generate top treatments for Markdown format
  const topTreatments = [
    'cognitive-behavioral-therapy',
    'dialectical-behavior-therapy',
    'selective-serotonin-reuptake-inhibitors',
    'acceptance-and-commitment-therapy',
    'eye-movement-desensitization-and-reprocessing',
    'mindfulness-based-cognitive-therapy',
  ];

  return topTreatments.map((slug) => ({ slug }));
}

export const revalidate = 86400; // 24 hours
export const dynamic = 'force-dynamic'; // Required because we access request.headers for AI bot tracking
