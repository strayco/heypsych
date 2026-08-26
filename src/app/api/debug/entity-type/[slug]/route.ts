import { NextRequest, NextResponse } from 'next/server';
import { EntityService } from '@/lib/data/entity-service';
import { getEntityType, isTreatmentType } from '@/lib/utils/entity-type';
import { isAdminAuthenticated } from '@/lib/auth/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Require admin authentication
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const entity = await EntityService.getBySlug(slug);

    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    const entityType = getEntityType(entity);
    const isTreatment = isTreatmentType(entityType);

    return NextResponse.json({
      slug,
      debug: {
        'entity.type': entity.type || 'NOT SET',
        'entity.schema.entity_type': entity.schema?.entity_type || 'NOT SET',
        'entity.schema.schema_name': entity.schema?.schema_name || 'NOT SET',
        'entity.data.type': entity.data?.type || 'NOT SET',
        'entity.data.kind': entity.data?.kind || 'NOT SET',
        'entity.content.type': (entity as any).content?.type || 'NOT SET',
        'entity.content.kind': (entity as any).content?.kind || 'NOT SET',
        'getEntityType() result': entityType,
        'isTreatmentType() result': isTreatment,
        'should_block_at_treatments_route': !isTreatment,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
