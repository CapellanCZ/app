/**
 * Show given + family name only (drop middle names from a full name string).
 */
export function displayNameWithoutMiddle(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0]!;
  return `${parts[0]} ${parts[parts.length - 1]}`;
}
