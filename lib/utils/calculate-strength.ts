type StrengthSlot = { strength: number; percentage: number };

export function calculateStrength(slots: StrengthSlot[]): number {
  if (slots.length === 0) return 0;
  const total = slots.reduce((sum, s) => sum + s.percentage, 0);
  if (total === 0) return 0;
  const weighted = slots.reduce(
    (sum, s) => sum + s.strength * s.percentage,
    0,
  );
  return weighted / total;
}
