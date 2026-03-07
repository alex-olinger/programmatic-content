export function slugify(str: string): string {
  const result = str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (result === '') {
    throw new Error(`slugify: input "${str}" produced an empty slug`);
  }
  return result;
}
