import { supabase } from '@/lib/supabase';

export const AVATAR_BUCKET = 'avatars';

function isLocalAvatarUri(value: string): boolean {
  return (
    value.startsWith('file://') ||
    value.startsWith('content://') ||
    value.startsWith('ph://') ||
    value.startsWith('data:')
  );
}

/** Turn a storage path, remote URL, or local preview URI into a displayable image URL. */
export function resolveAvatarDisplayUrl(
  avatarUrl: string | null | undefined,
  cacheBust?: boolean,
): string | null {
  if (!avatarUrl?.trim()) return null;

  const trimmed = avatarUrl.trim();
  if (isLocalAvatarUri(trimmed)) {
    return trimmed;
  }

  let url: string;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    url = trimmed.split('?')[0] ?? trimmed;
  } else if (supabase) {
    url = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(trimmed).data.publicUrl;
  } else {
    return null;
  }

  if (cacheBust) {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}t=${Date.now()}`;
  }

  return url;
}

export function avatarStoragePath(userId: string, ext: string): string {
  return `${userId}/avatar.${ext}`;
}

/** Remove every file in the user's avatar folder before uploading a replacement. */
export async function deleteUserAvatarsFromStorage(userId: string): Promise<void> {
  if (!supabase) return;

  const { data: files, error } = await supabase.storage.from(AVATAR_BUCKET).list(userId);
  if (error) {
    console.warn('[avatarUtils] list avatars', error.message);
    return;
  }

  if (!files?.length) return;

  const paths = files
    .filter((file) => file.name && !file.name.endsWith('/'))
    .map((file) => `${userId}/${file.name}`);

  if (!paths.length) return;

  const { error: removeError } = await supabase.storage.from(AVATAR_BUCKET).remove(paths);
  if (removeError) {
    console.warn('[avatarUtils] remove avatars', removeError.message);
  }
}
