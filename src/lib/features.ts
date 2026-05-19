export const ALL_FEATURES = ['breakfast'] as const;
export type Feature = (typeof ALL_FEATURES)[number];

const enabledSet = new Set(
  (process.env.NEXT_PUBLIC_ENABLED_FEATURES ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);

export function isFeatureEnabled(feature: Feature): boolean {
  return enabledSet.has(feature);
}
