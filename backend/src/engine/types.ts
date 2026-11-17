/**
 * Tipos del motor de cálculo. Módulo puro: no depende de Express ni de Sequelize.
 */

export type RuleType =
  | 'LINE_TOTAL'
  | 'CEIL_RATIO'
  | 'PERCENT_OF_DAYS'
  | 'UNIT_COST_DELTA'
  | 'REFERENCE_SALARY'
  | 'INTERNAL_COST_NORMALIZED'
  | 'SAMPLE_SIZING'
  | 'PROPORTIONAL_DATA_COST'
  | 'EXPECTED_MARGIN';

/** Parámetros de negocio usados por REFERENCE_SALARY / INTERNAL_COST_NORMALIZED */
export interface SalaryParams {
  baseMonthlySalary: number;
  incrementRatio: number;
  reductionRatio: number;
  workingDaysPerMonth: number;
}

/** Parámetros del bloque de dimensionamiento de muestra (Piloto/Levantamiento) */
export interface SizingParams {
  sampleSize: number;
  baseEffectiveness: number;
  attempts: number;
  minutesBetweenAttempts: number;
  surveyMinutes: number;
  workHoursDay: number;
  teamSize: number;
  errorMargin: number;
  daysPerWeek: number;
}

export interface SizingResult {
  baseUniverse: number;
  fieldDaysPerson: number;
  executionDaysByTeam: number;
  dailyProductivity: number;
  proposedExecutionDays: number;
  dailyAttempts: number;
  workWeeks: number;
}

/** Definición de una línea de costo dentro de una fase, ya resuelta (cantidad/días numéricos). */
export interface LineItemInput {
  catalogItemId: number;
  itemName: string;
  categoryCode: string;
  quantity: number;
  days: number;
  unitPriceUsd: number;
  /** Costo unitario base de la fase (ej. Encuestador local) para normalizar el costo interno. */
  baseUnitPriceUsd?: number;
  /** Tarifa de referencia (por día) a usar en el costo interno normalizado. */
  referenceSalaryPerDay?: number;
}

export interface LineItemResult extends LineItemInput {
  totalUsd: number;
  totalLocal: number;
  internalCostUsd: number;
  ruleSnapshot: Record<string, unknown>;
}

export interface PhaseInput {
  phaseId: number;
  phaseCode: string;
  phaseName: string;
  sortOrder: number;
  items: LineItemInput[];
}

export interface PhaseResult {
  phaseId: number;
  phaseName: string;
  sortOrder: number;
  items: LineItemResult[];
  subtotalUsd: number;
  subtotalLocal: number;
  subtotalInternalCostUsd: number;
}

export interface QuoteCalculationInput {
  exchangeRate: number;
  phases: PhaseInput[];
  incentivesUsd: number;
}

export interface SummaryLine {
  label: string;
  valueUsd: number;
  valueLocal: number;
  kind:
    | 'TOTAL_OPERACION'
    | 'INCENTIVOS'
    | 'TOTAL'
    | 'COSTO_INTERNO_TOTAL'
    | 'MARGEN_VALOR'
    | 'MARGEN_PORCENTAJE'
    | 'COSTO_POR_MUESTRA';
}

export interface QuoteCalculationResult {
  phases: PhaseResult[];
  summary: SummaryLine[];
  totalOperationUsd: number;
  totalUsd: number;
  totalInternalCostUsd: number;
  marginValueUsd: number;
  marginPercent: number;
}
