export interface CountryConfigurationInput {
  paymentIncreaseRatio?: number | null;
  reducedDayDiscountRatio?: number | null;
  exchangeRate?: number | null;
  referenceDailySalaryLocal?: number | null;
  referenceDailySalaryUsd?: number | null;
}

export interface CountryConfigurationStatus {
  isConfigured: boolean;
  missingFields: string[];
}

export function getEffectiveExchangeRate(activeRate: number | null | undefined, configuredRate: number | null | undefined): number {
  if (activeRate != null && Number(activeRate) > 0) return Number(activeRate);
  if (configuredRate != null && Number(configuredRate) > 0) return Number(configuredRate);
  return 1;
}

export interface CountrySalaryParams {
  baseMonthlySalary: number;
  incrementRatio: number;
  reductionRatio: number;
  workingDaysPerMonth: number;
  exchangeRate: number;
  referenceSalaryPerDay: number;
  reducedSalaryPerDay: number;
}

export function buildCountrySalaryParams(input: CountryConfigurationInput): CountrySalaryParams {
  const baseMonthlySalary = Number(input.referenceDailySalaryLocal ?? 0);
  const incrementRatio = Number(input.paymentIncreaseRatio ?? 0);
  const reductionRatio = Number(input.reducedDayDiscountRatio ?? 0);
  const workingDaysPerMonth = 26.8;
  const exchangeRate = Number(input.exchangeRate ?? 1);

  return {
    baseMonthlySalary,
    incrementRatio,
    reductionRatio,
    workingDaysPerMonth,
    exchangeRate,
    referenceSalaryPerDay: (baseMonthlySalary * (1 + incrementRatio)) / workingDaysPerMonth,
    reducedSalaryPerDay: (baseMonthlySalary * (1 + incrementRatio - reductionRatio)) / workingDaysPerMonth,
  };
}

export function buildCountryCompletionStatus(input: CountryConfigurationInput): CountryConfigurationStatus {
  const missingFields: string[] = [];

  if (input.paymentIncreaseRatio == null || Number(input.paymentIncreaseRatio) <= 0) {
    missingFields.push('Ratio incremento pago');
  }

  if (input.reducedDayDiscountRatio == null || Number(input.reducedDayDiscountRatio) < 0) {
    missingFields.push('Ratio descuento día reducido');
  }

  if (input.exchangeRate == null || Number(input.exchangeRate) <= 0) {
    missingFields.push('Tasa de cambio');
  }

  if (input.referenceDailySalaryLocal == null || Number(input.referenceDailySalaryLocal) <= 0) {
    missingFields.push('Salario referencia');
  }

  if (input.referenceDailySalaryUsd !== undefined && input.referenceDailySalaryUsd !== null && Number(input.referenceDailySalaryUsd) <= 0) {
    missingFields.push('Equivalente USD del salario referencia');
  }

  return {
    isConfigured: missingFields.length === 0,
    missingFields,
  };
}
