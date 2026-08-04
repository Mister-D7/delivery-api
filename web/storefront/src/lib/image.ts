export function imgSrc(url?: string | null): string {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? `/api/img?url=${encodeURIComponent(url)}` : url;
}

export function isImageUrl(url?: string | null): boolean {
  return /\.(jpe?g|png|webp|gif|avif)(\?|#|$)/i.test(url || '');
}
