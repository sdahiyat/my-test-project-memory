'use client';

import { useState, useCallback } from 'react';
import type { CloudinaryUploadResult, SignedUploadParams } from '@/types/cloudinary';

export const SUPPORTED_FORMATS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
] as const;

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

interface UseCloudinaryUploadReturn {
  upload: (
    file: File,
    options?: {
      folder?: string;
      onProgress?: (percent: number) => void;
    }
  ) => Promise<CloudinaryUploadResult>;
  isUploading: boolean;
  progress: number;
  error: string | null;
  reset: () => void;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function uploadWithXHR(
  url: string,
  formData: FormData,
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText) as CloudinaryUploadResult;
          resolve(result);
        } catch {
          reject(new Error('Failed to parse Cloudinary response'));
        }
      } else {
        let errorMessage = `Upload failed with status ${xhr.status}`;
        try {
          const errorBody = JSON.parse(xhr.responseText);
          if (errorBody?.error?.message) {
            errorMessage = errorBody.error.message;
          }
        } catch {
          // Use default error message
        }
        reject(new Error(errorMessage));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was aborted'));
    });

    xhr.open('POST', url);
    xhr.send(formData);
  });
}

export function useCloudinaryUpload(): UseCloudinaryUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  const upload = useCallback(
    async (
      file: File,
      options?: {
        folder?: string;
        onProgress?: (percent: number) => void;
      }
    ): Promise<CloudinaryUploadResult> => {
      // Validate file type
      if (!SUPPORTED_FORMATS.includes(file.type as (typeof SUPPORTED_FORMATS)[number])) {
        const errorMsg = `Unsupported file type: ${file.type}. Supported formats: JPEG, PNG, WebP, HEIC.`;
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE_BYTES) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const errorMsg = `File size (${sizeMB}MB) exceeds the maximum allowed size of 50MB.`;
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        // Step 1: Get signed upload params from our API
        const signResponse = await fetch('/api/cloudinary/sign-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folder: options?.folder }),
        });

        if (!signResponse.ok) {
          const signError = await signResponse.json().catch(() => ({}));
          throw new Error(
            signError?.error ?? `Failed to get upload signature (${signResponse.status})`
          );
        }

        const signedParams: SignedUploadParams = await signResponse.json();

        // Step 2: Build FormData for direct upload to Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('signature', signedParams.signature);
        formData.append('timestamp', String(signedParams.timestamp));
        formData.append('api_key', signedParams.apiKey);
        formData.append('folder', signedParams.folder);
        formData.append('eager', signedParams.eager);
        formData.append('tags', signedParams.tags);

        const uploadUrl = `https://api.cloudinary.com/v1_1/${signedParams.cloudName}/image/upload`;

        // Step 3: Upload with retry logic (up to 3 attempts on network failure)
        const MAX_RETRIES = 3;
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          try {
            const onProgress = (percent: number) => {
              setProgress(percent);
              options?.onProgress?.(percent);
            };

            const result = await uploadWithXHR(uploadUrl, formData, onProgress);
            setProgress(100);
            return result;
          } catch (uploadError) {
            lastError = uploadError instanceof Error
              ? uploadError
              : new Error('Unknown upload error');

            // Only retry on network errors, not on Cloudinary API errors
            const isNetworkError =
              lastError.message === 'Network error during upload' ||
              lastError.message === 'Upload was aborted';

            if (!isNetworkError || attempt === MAX_RETRIES) {
              throw lastError;
            }

            console.warn(
              `[useCloudinaryUpload] Upload attempt ${attempt} failed, retrying in 1s...`,
              lastError.message
            );
            await sleep(1000);
          }
        }

        // Should never reach here, but TypeScript needs this
        throw lastError ?? new Error('Upload failed after all retries');
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'An unexpected error occurred during upload';
        setError(errorMsg);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  return { upload, isUploading, progress, error, reset };
}
