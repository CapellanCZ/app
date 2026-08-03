export type Announcement = {
  id: string;
  title: string;
  body: string;
  publishedAt: string | null;
  /** Signed (or empty) URL for the primary image attachment. */
  imageUrl: string | null;
};
