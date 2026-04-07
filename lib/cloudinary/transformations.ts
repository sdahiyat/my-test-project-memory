import cloudinary from './config';

export const PHOTO_TRANSFORMATIONS = {
  thumbnail: {
    width: 200,
    height: 200,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    fetch_format: 'auto',
  },
  small: {
    width: 400,
    crop: 'limit',
    quality: 'auto:good',
    fetch_format: 'auto',
  },
  medium: {
    width: 800,
    crop: 'limit',
    quality: 'auto:good',
    fetch_format: 'auto',
  },
  large: {
    width: 1600,
    crop: 'limit',
    quality: 'auto:best',
    fetch_format: 'auto',
  },
  original: {
    quality: 'auto:best',
    fetch_format: 'auto',
  },
} as const;

export const AVATAR_TRANSFORMATIONS = {
  small: {
    width: 64,
    height: 64,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    fetch_format: 'auto',
  },
  medium: {
    width: 128,
    height: 128,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    fetch_format: 'auto',
  },
  large: {
    width: 256,
    height: 256,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    fetch_format: 'auto',
  },
} as const;

export type PhotoTransformationKey = keyof typeof PHOTO_TRANSFORMATIONS;
export type AvatarTransformationKey = keyof typeof AVATAR_TRANSFORMATIONS;

export function buildTransformationUrl(
  publicId: string,
  transformation: PhotoTransformationKey | AvatarTransformationKey
): string {
  const photoTransformation =
    PHOTO_TRANSFORMATIONS[transformation as PhotoTransformationKey];
  const avatarTransformation =
    AVATAR_TRANSFORMATIONS[transformation as AvatarTransformationKey];

  const selectedTransformation = photoTransformation ?? avatarTransformation;

  return cloudinary.url(publicId, selectedTransformation);
}

export function buildResponsiveUrls(
  publicId: string
): Record<'thumbnail' | 'small' | 'medium' | 'large' | 'original', string> {
  return {
    thumbnail: cloudinary.url(publicId, PHOTO_TRANSFORMATIONS.thumbnail),
    small: cloudinary.url(publicId, PHOTO_TRANSFORMATIONS.small),
    medium: cloudinary.url(publicId, PHOTO_TRANSFORMATIONS.medium),
    large: cloudinary.url(publicId, PHOTO_TRANSFORMATIONS.large),
    original: cloudinary.url(publicId, PHOTO_TRANSFORMATIONS.original),
  };
}
