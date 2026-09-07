/**
 * Resolve a public asset path for dev, preview, and GitHub Pages (base: './').
 *
 * Path segments are URI-encoded, but `$` is left literal: filenames like
 * `$Copy.png` exist on disk, and Vite/sirv serve `%24Copy.png` as SPA HTML.
 */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL;
  const normalized = path.replace(/^\//, '');
  const encoded = normalized
    .split('/')
    .map((segment) => encodeURIComponent(segment).replace(/%24/g, '$'))
    .join('/');
  return `${base}${encoded}`;
}
