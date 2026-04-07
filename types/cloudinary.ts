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

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  bytes: number;
  original_filename: string;
  version: number;
  signature: string;
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

export interface ResponsiveImageUrls {
  thumbnail: string;
  small: string;
  medium: string;
  large: string;
  original: string;
}
