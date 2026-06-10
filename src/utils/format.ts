export const formatNumber = (value: number, digits = 2): string => {
  if (!Number.isFinite(value)) return 'n/a';
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(digits)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(digits)}k`;
  return value.toFixed(digits);
};

export const formatMs = (value: number): string => `${value.toFixed(value > 10 ? 1 : 2)} ms`;

export const bodyTypeLabel = (type: string): string => type.replace('-', ' ').toUpperCase();
