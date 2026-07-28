/** Strapi has no slug field, so teacher URLs are derived from the name. */
export function teacherSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
