export type Announcement = {
  id: string;
  title: string;
  body: string;
  /** Visibility audience from DB (`All`, `Student`, `Faculty`, `Employee`). */
  audience: string | null;
  publishedAt: string | null;
  /** Signed (or empty) URL for the primary image attachment. */
  imageUrl: string | null;
};
