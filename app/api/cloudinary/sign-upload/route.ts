import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { generateSignedUploadParams } from '@/lib/cloudinary/upload';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { folder?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional; default to empty object
    }

    const params = await generateSignedUploadParams({
      userId: session.user.id,
      folder: body.folder ?? 'photos',
    });

    return NextResponse.json(params, { status: 200 });
  } catch (error) {
    console.error('[sign-upload] Error generating upload signature:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload signature' },
      { status: 500 }
    );
  }
}
