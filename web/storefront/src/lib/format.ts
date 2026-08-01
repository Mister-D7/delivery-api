export function formatPrice(n: number): string {
  const v = Math.round(Number.isFinite(n) ? n : 0);
  return v.toLocaleString('fr-FR').replace(/\u00a0/g, ' ');
}
