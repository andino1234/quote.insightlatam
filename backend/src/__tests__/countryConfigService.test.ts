import { buildCountryCompletionStatus, buildCountrySalaryParams, getEffectiveExchangeRate } from '../services/countryConfig.service';

describe('countryConfigService', () => {
  test('construye los parámetros de salario a partir de la configuración del país', () => {
    const params = buildCountrySalaryParams({
      paymentIncreaseRatio: 0.22,
      reducedDayDiscountRatio: 0.3,
      referenceDailySalaryLocal: 4931,
      exchangeRate: 24.5,
    });

    expect(params.baseMonthlySalary).toBe(4931);
    expect(params.incrementRatio).toBeCloseTo(0.22);
    expect(params.reductionRatio).toBeCloseTo(0.3);
    expect(params.workingDaysPerMonth).toBeCloseTo(26.8);
    expect(params.referenceSalaryPerDay).toBeCloseTo((4931 * (1 + 0.22)) / 26.8);
    expect(params.reducedSalaryPerDay).toBeCloseTo((4931 * (1 + 0.22 - 0.3)) / 26.8);
    expect(params.exchangeRate).toBeCloseTo(24.5);
  });

  test('marca configuración incompleta cuando faltan parámetros obligatorios', () => {
    const result = buildCountryCompletionStatus({
      paymentIncreaseRatio: null,
      reducedDayDiscountRatio: 0.3,
      referenceDailySalaryLocal: 4931,
      exchangeRate: null,
    });

    expect(result.isConfigured).toBe(false);
    expect(result.missingFields).toContain('Tasa de cambio');
    expect(result.missingFields).toContain('Ratio incremento pago');
  });

  test('marca configuración completa cuando todos los campos obligatorios existen', () => {
    const result = buildCountryCompletionStatus({
      paymentIncreaseRatio: 0.22,
      reducedDayDiscountRatio: 0.3,
      referenceDailySalaryLocal: 4931,
      exchangeRate: 157,
    });

    expect(result.isConfigured).toBe(true);
    expect(result.missingFields).toEqual([]);
  });

  test('usa la tasa del mantenimiento cuando no existe una tasa activa para el país', () => {
    expect(getEffectiveExchangeRate(null, 24.5)).toBeCloseTo(24.5);
    expect(getEffectiveExchangeRate(undefined, 24.5)).toBeCloseTo(24.5);
    expect(getEffectiveExchangeRate(27.3, 24.5)).toBeCloseTo(27.3);
  });
});
