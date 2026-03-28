export type DcaFrequency = 'daily' | 'weekly' | 'monthly';

export const DCA_FREQUENCIES: readonly DcaFrequency[] = [
  'daily',
  'weekly',
  'monthly',
] as const;
