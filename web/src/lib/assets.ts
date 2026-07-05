/**
 * Resolve a public asset path for dev, preview, and GitHub Pages (base: './').
 */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL;
  const normalized = path.replace(/^\//, '');
  const encoded = normalized
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `${base}${encoded}`;
}
