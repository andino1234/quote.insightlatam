import { ceilRatio, lineTotal, percentOfDays, unitCostDelta, referenceSalaryPerDay, internalCostNormalized, expectedMargin, sampleSizing } from '../rules';

describe('Motor de cálculo - reglas puras (validadas contra el Excel de referencia)', () => {
  test('LINE_TOTAL replica Cantidad x Días x Costo Unitario (fila 4 Reclutamiento)', () => {
    expect(lineTotal(1, 5, 24)).toBe(120);
  });

  test('CEIL_RATIO replica ROUNDUP(encuestadores/5,0) (fila 5 Reclutamiento)', () => {
    expect(ceilRatio(1, 5)).toBe(1);
    expect(ceilRatio(15, 5)).toBe(3);
    expect(ceilRatio(11, 5)).toBe(3);
  });

  test('CEIL_RATIO replica supervisor corporativo con ratio 20', () => {
    expect(ceilRatio(1, 20)).toBe(1);
  });

  test('PERCENT_OF_DAYS replica ROUNDUP(dias*0.5,0) y *0.2', () => {
    expect(percentOfDays(5, 0.5)).toBe(3);
    expect(percentOfDays(5, 0.2)).toBe(1);
  });

  test('UNIT_COST_DELTA replica el diferencial de costo unitario por rol', () => {
    expect(unitCostDelta(24, 10)).toBe(34); // Supervisor local = Encuestador + 10
  });

  test('REFERENCE_SALARY equivalente en USD (sin dependencia de la tasa, coherente con columna I del Excel)', () => {
    const salary = referenceSalaryPerDay({ baseMonthlySalary: 690, incrementRatio: 0.22, reductionRatio: 0, workingDaysPerMonth: 26.8 });
    expect(salary).toBeCloseTo(31.41, 1);
  });

  test('INTERNAL_COST_NORMALIZED calcula el costo interno de una línea', () => {
    const salary = referenceSalaryPerDay({ baseMonthlySalary: 690, incrementRatio: 0.22, reductionRatio: 0.3, workingDaysPerMonth: 26.8 });
    const cost = internalCostNormalized(1, 5, 34, 24, salary);
    expect(cost).toBeGreaterThan(0);
  });

  test('EXPECTED_MARGIN calcula el margen esperado', () => {
    const { marginValue, marginPercent } = expectedMargin(67188, 56142.01);
    expect(marginValue).toBeCloseTo(11045.98, 1);
    expect(marginPercent).toBeCloseTo(0.1644, 3);
  });

  test('SAMPLE_SIZING calcula el dimensionamiento de campo (bloque Piloto)', () => {
    const result = sampleSizing({
      sampleSize: 50,
      baseEffectiveness: 0.5,
      attempts: 3,
      minutesBetweenAttempts: 40,
      surveyMinutes: 55,
      workHoursDay: 8,
      teamSize: 5,
      errorMargin: 0.05,
      daysPerWeek: 5,
    });
    expect(result.baseUniverse).toBeCloseTo(100, 5);
    expect(result.executionDaysByTeam).toBe(5);
    expect(result.proposedExecutionDays).toBe(6);
  });
});
