export type Announcement = {
  id: string;
  title: string;
  body: string;
  /** Visibility audience from DB (`All`, `Student`, `Faculty`, `Employee`). */
  audience: string | null;
  publishedAt: string | null;
  /** Signed URL for the primary (first) image — used by list thumbnails. */
  imageUrl: string | null;
  /** All signed image attachment URLs (campaign gallery), oldest → newest. */
  imageUrls: string[];
};
