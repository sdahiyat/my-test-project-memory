import cloudinary from './config';

export const SUPPORTED_FORMATS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
] as const;

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export interface SignedUploadParams {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  uploadPreset?: string;
  tags: string;
  eager: string;
}

export async function generateSignedUploadParams(options: {
  folder?: string;
  userId: string;
  tags?: string[];
}): Promise<SignedUploadParams> {
  const folder = options.folder ?? 'photos';

  // Eager transformation string for all 5 responsive sizes
  const eager = [
    'w_200,h_200,c_fill,g_auto,q_auto,f_auto',
    'w_400,c_limit,q_auto:good,f_auto',
    'w_800,c_limit,q_auto:good,f_auto',
    'w_1600,c_limit,q_auto:best,f_auto',
  ].join('|');

  const timestamp = Math.round(Date.now() / 1000);

  const baseTags = [`userId:${options.userId}`, ...(options.tags ?? [])];
  const tags = baseTags.join(',');

  const paramsToSign: Record<string, string | number> = {
    folder,
    eager,
    timestamp,
    tags,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder,
    tags,
    eager,
  };
}
