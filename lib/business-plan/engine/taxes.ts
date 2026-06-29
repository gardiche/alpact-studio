// Impôts et taxes (hors IS) for French companies
// CFE: ~0.75% of value added (simplified estimate)
// Taxe d'apprentissage: 0.68% of gross payroll
// Formation continue: 0.55% of gross payroll (< 11 employees), 1% (>= 11)

export function calculateTaxesAndDuties(
  payroll: number[],
  months = 36
): number[] {
  const monthly = Array(months).fill(0);

  for (let i = 0; i < months; i++) {
    const grossPayroll = payroll[i] ?? 0;
    if (grossPayroll <= 0) continue;

    const apprentissage = grossPayroll * 0.0068;
    const formation = grossPayroll * 0.0055;
    monthly[i] = apprentissage + formation;
  }

  // CFE: flat annual amount paid in December (month 12, 24, 36)
  // Estimated at ~500€/year for a small digital company, increasing with payroll
  for (let y = 0; y < 3; y++) {
    const yearPayroll = payroll.slice(y * 12, (y + 1) * 12).reduce((s, v) => s + v, 0);
    const cfe = Math.max(500, yearPayroll * 0.0075);
    const decemberIdx = (y + 1) * 12 - 1;
    if (decemberIdx < months) {
      monthly[decemberIdx] += cfe;
    }
  }

  return monthly;
}
