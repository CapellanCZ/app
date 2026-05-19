import { supabase } from '@/lib/supabase';

const AVATAR_BUCKET = 'avatars';

/** Turn a storage path or legacy full URL into a displayable image URL. */
export function resolveAvatarDisplayUrl(
  avatarUrl: string | null | undefined,
  cacheBust?: boolean,
): string | null {
  if (!avatarUrl?.trim()) return null;

  const trimmed = avatarUrl.trim();
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
