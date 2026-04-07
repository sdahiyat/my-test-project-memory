import { createHmac, timingSafeEqual } from 'crypto';

export interface CloudinaryWebhookPayload {
  notification_type: string;
  timestamp: string;
  request_id: string;
  public_id: string;
  version: number;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  url: string;
  secure_url: string;
  folder: string;
  original_filename: string;
  eager?: Array<{
    transformation: string;
    width: number;
    height: number;
    bytes: number;
    format: string;
    url: string;
    secure_url: string;
  }>;
  image_metadata?: Record<string, string>;
  exif?: Record<string, string>;
  tags?: string[];
}

export interface ExtractedEXIF {
  camera?: string;
  lens?: string;
  focalLength?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: string;
  dateTaken?: string;
  hasGPS: boolean;
}

export function validateCloudinaryWebhookSignature(
  body: string,
  timestamp: string,
  signature: string
): boolean {
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!secret) {
    throw new Error('CLOUDINARY_API_SECRET is not configured');
  }

  const expectedSignature = createHmac('sha1', secret)
    .update(body + timestamp)
    .digest('hex');

  try {
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const actualBuffer = Buffer.from(signature, 'utf8');

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, actualBuffer);
  } catch {
    return false;
  }
}

export function extractEXIFData(
  payload: CloudinaryWebhookPayload
): ExtractedEXIF {
  const metadata = payload.image_metadata ?? {};
  const exif = payload.exif ?? {};

  // Merge both sources, preferring image_metadata
  const combined: Record<string, string> = { ...exif, ...metadata };

  const hasGPS = Boolean(
    combined['GPSLatitude'] || combined['GPSLongitude']
  );

  const camera =
    combined['Make'] && combined['Model']
      ? `${combined['Make']} ${combined['Model']}`.trim()
      : combined['Make'] || combined['Model'] || undefined;

  return {
    camera,
    lens: combined['LensModel'] || undefined,
    focalLength: combined['FocalLength'] || undefined,
    aperture: combined['FNumber'] || undefined,
    shutterSpeed: combined['ExposureTime'] || undefined,
    iso: combined['ISOSpeedRatings'] || undefined,
    dateTaken: combined['DateTimeOriginal'] || undefined,
    hasGPS,
    // GPS coordinates intentionally NOT included per spec
  };
}
