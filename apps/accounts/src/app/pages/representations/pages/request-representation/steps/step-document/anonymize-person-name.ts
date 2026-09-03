export function anonymizePersonName(value: unknown): string {
  if (typeof value !== 'string') return '';

  const name = value.replace(/\s+/g, '');
  if (!name) return '';
  if (name.length === 1) return '*';

  // Keep at most three characters at each end and mask at least half of the name.
  const visibleLength = Math.min(6, Math.floor(name.length / 2));
  const prefixLength = Math.min(3, Math.ceil(visibleLength / 2));
  const suffixLength = visibleLength - prefixLength;
  const suffixStart = name.length - suffixLength;

  return `${name.slice(0, prefixLength)}${'*'.repeat(
    name.length - visibleLength,
  )}${suffixLength ? name.slice(suffixStart) : ''}`;
}
