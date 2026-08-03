import { isSupabaseConfigured, supabase } from '@/lib/supabase';

import type { Announcement } from './types';

const ATTACHMENT_BUCKET = 'announcement-attachments';
const SIGNED_URL_TTL_SEC = 60 * 60; // 1 hour
const MAX_SLIDES = 3;
const MAX_SENTENCES = 3;

/** Keep at most N sentences for the card preview. */
export function limitSentences(text: string, max = MAX_SENTENCES): string {
  const trimmed = text.trim();
  if (!trimmed) return '';

  const parts = trimmed.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  if (!parts || parts.length <= max) return trimmed;

  return parts
    .slice(0, max)
    .map((s) => s.trim())
    .join(' ');
}

type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  published_at: string | null;
  announcement_attachments:
    | {
        file_path: string;
        kind: string;
        created_at: string;
      }[]
    | null;
};

function formatDateLabel(iso: string | null): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}

async function signedImageUrl(filePath: string): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.storage
    .from(ATTACHMENT_BUCKET)
    .createSignedUrl(filePath, SIGNED_URL_TTL_SEC);
  if (error || !data?.signedUrl) {
    console.warn('[announcements] signed URL failed:', error?.message ?? filePath);
    return null;
  }
  return data.signedUrl;
}

/**
 * Published campus-wide announcements for the logged-in patient (audience = All).
 */
export async function fetchPublishedAnnouncements(): Promise<Announcement[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('announcements')
    .select(
      `
      id,
      title,
      body,
      published_at,
      announcement_attachments (
        file_path,
        kind,
        created_at
      )
    `,
    )
    .eq('status', 'published')
    .eq('audience', 'All')
    .order('published_at', { ascending: false })
    .limit(MAX_SLIDES);

  if (error) {
    console.error('[announcements] fetchPublishedAnnouncements:', error.message);
    return [];
  }

  const rows = (data as AnnouncementRow[] | null) ?? [];

  return Promise.all(
    rows.map(async (row) => {
      const images = (row.announcement_attachments ?? [])
        .filter((a) => a.kind === 'image' && a.file_path)
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
      const primary = images[0];
      const imageUrl = primary ? await signedImageUrl(primary.file_path) : null;

      return {
        id: row.id,
        title: row.title,
        body: row.body ?? '',
        publishedAt: row.published_at,
        imageUrl,
      } satisfies Announcement;
    }),
  );
}

export { formatDateLabel };
