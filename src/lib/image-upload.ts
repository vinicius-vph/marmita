import { createAdminClient } from '@/lib/supabase/server';
import { IMAGE_BUCKET, IMAGE_MAX_SIZE, ALLOWED_MIME_TYPES, UUID_REGEX } from '@/lib/constants';

function isValidImageBytes(bytes: Uint8Array, mimeType: string): boolean {
  if (mimeType === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === 'image/png') return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (mimeType === 'image/webp') return bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  return false;
}

export async function uploadImage(
  supabase: ReturnType<typeof createAdminClient>,
  file: File
): Promise<{ url: string | null; error?: string }> {
  if (file.size > IMAGE_MAX_SIZE) return { url: null, error: 'File too large (max 2 MB)' };

  const ext = ALLOWED_MIME_TYPES[file.type];
  if (!ext) return { url: null, error: 'Invalid file type' };

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (!isValidImageBytes(bytes, file.type)) return { url: null, error: 'Invalid file type' };

  const fileName = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(fileName, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { url: null };

  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(fileName);
  return { url: data.publicUrl };
}

export function fileNameFromUrl(url: string): string | null {
  try {
    const fileName = new URL(url).pathname.split('/').pop() ?? null;
    if (!fileName) return null;
    const nameWithoutExt = fileName.split('.')[0];
    if (!UUID_REGEX.test(nameWithoutExt)) return null;
    return fileName;
  } catch {
    return null;
  }
}

export async function deleteImage(
  supabase: ReturnType<typeof createAdminClient>,
  imageUrl: string
): Promise<void> {
  const fileName = fileNameFromUrl(imageUrl);
  if (fileName) {
    await supabase.storage.from(IMAGE_BUCKET).remove([fileName]);
  }
}
