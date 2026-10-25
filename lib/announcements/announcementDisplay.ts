/**
 * Soft title case for ALL-CAPS admin titles → "World Hepatitis Day".
 */
export function displayAnnouncementTitle(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed !== trimmed.toUpperCase()) return trimmed;
  return trimmed
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

export type AnnouncementBodyPart =
  | { kind: 'text'; value: string }
  | { kind: 'hashtag'; value: string };

/**
 * Split body into plain text + hashtag spans so UI can color `#tags` brand blue.
 */
export function splitAnnouncementBody(body: string): AnnouncementBodyPart[] {
  const trimmed = body.trim();
  if (!trimmed) return [];

  const parts: AnnouncementBodyPart[] = [];
  const re = /(#[A-Za-z0-9_]+)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(trimmed)) !== null) {
    if (match.index > last) {
      parts.push({ kind: 'text', value: trimmed.slice(last, match.index) });
    }
    parts.push({ kind: 'hashtag', value: match[1]! });
    last = match.index + match[1]!.length;
  }
  if (last < trimmed.length) {
    parts.push({ kind: 'text', value: trimmed.slice(last) });
  }
  return parts;
}
