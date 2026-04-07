import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  validateCloudinaryWebhookSignature,
  extractEXIFData,
  CloudinaryWebhookPayload,
} from '@/lib/cloudinary/webhook';
import { buildResponsiveUrls } from '@/lib/cloudinary/transformations';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let rawBody: string;

  try {
    // Must read as raw text for signature validation — do NOT use request.json() first
    rawBody = await request.text();
  } catch (error) {
    console.error('[cloudinary-webhook] Failed to read request body:', error);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  try {
    const timestamp = request.headers.get('x-cld-timestamp') ?? '';
    const signature = request.headers.get('x-cld-signature') ?? '';

    if (!timestamp || !signature) {
      console.warn('[cloudinary-webhook] Missing signature headers');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const isValid = validateCloudinaryWebhookSignature(
      rawBody,
      timestamp,
      signature
    );

    if (!isValid) {
      console.warn('[cloudinary-webhook] Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload: CloudinaryWebhookPayload = JSON.parse(rawBody);

    // Only process upload events
    if (payload.notification_type !== 'upload') {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Extract userId from tags (format: "userId:xxx")
    const tags = payload.tags ?? [];
    const userIdTag = tags.find((tag) => tag.startsWith('userId:'));
    if (!userIdTag) {
      console.error(
        '[cloudinary-webhook] No userId tag found in payload tags:',
        tags
      );
      return NextResponse.json({ received: true }, { status: 200 });
    }
    const userId = userIdTag.replace('userId:', '');

    const exifData = extractEXIFData(payload);
    const responsiveUrls = buildResponsiveUrls(payload.public_id);

    // Use service role client to bypass RLS for server-to-server operation
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: insertError } = await supabaseAdmin.from('photos').insert({
      cloudinary_public_id: payload.public_id,
      user_id: userId,
      cloudinary_url: payload.secure_url,
      thumbnail_url: responsiveUrls.thumbnail,
      small_url: responsiveUrls.small,
      medium_url: responsiveUrls.medium,
      large_url: responsiveUrls.large,
      original_url: responsiveUrls.original,
      width: payload.width,
      height: payload.height,
      format: payload.format,
      file_size_bytes: payload.bytes,
      exif_data: exifData,
      has_gps: exifData.hasGPS,
      ai_analysis_status: 'pending',
      created_at: payload.created_at,
    });

    if (insertError) {
      console.error(
        '[cloudinary-webhook] Failed to insert photo record:',
        insertError
      );
      // Return 200 to prevent Cloudinary retry storms; error is logged server-side
      return NextResponse.json({ received: true }, { status: 200 });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[cloudinary-webhook] Unexpected error:', error);
    // Always return 200 to prevent Cloudinary retry storms
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
