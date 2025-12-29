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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Fetch entity from database
    const entity = await EntityService.getBySlug(slug);

    if (!entity || entity.type !== 'condition') {
      return new NextResponse('Condition not found', { status: 404 });
    }

    // Convert to Markdown
    const markdown = conditionToMarkdown(entity);

    // Return Markdown with proper headers
    return new NextResponse(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400', // 24 hour cache
        'X-Content-Format': 'markdown',
        'X-Optimized-For': 'LLM-Ingestion',
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
