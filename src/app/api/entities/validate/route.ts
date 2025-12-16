// API route for client-side entity validation
import { NextRequest, NextResponse } from 'next/server';
import { validateEntityExists } from '@/lib/linking/utils';
import type { EntityType } from '@/lib/types/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');
    const type = searchParams.get('type') as EntityType;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Missing name or type parameter' },
        { status: 400 }
      );
    }

    const entity = await validateEntityExists(name, type);

    if (!entity) {
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json(entity);
  } catch (error) {
    console.error('Error validating entity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
