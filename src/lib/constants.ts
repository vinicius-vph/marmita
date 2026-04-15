import type { Category } from '@/types';

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const VALID_CATEGORIES: Category[] = ['meals', 'breakfast'];

export const IMAGE_BUCKET = 'menu-images';
export const IMAGE_MAX_SIZE = 2 * 1024 * 1024;

export const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
