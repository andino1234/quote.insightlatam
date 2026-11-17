export interface QuoteConfig {
  pais: string;
  ratioIncrementoPago: number;
  ratioDescuentoDiaReducido: number;
  tasaCambio: number;
  salarioBaseReferencia: number;
  muestraPiloto: number;
  muestraLevantamiento: number;
  incentivoUnitarioPiloto: number;
  incentivoUnitarioEvaluacion: number;
}

export const DEFAULT_QUOTE_CONFIG: QuoteConfig = {
  pais: 'Jamaica',
  ratioIncrementoPago: 0.22,
  ratioDescuentoDiaReducido: 0.3,
  tasaCambio: 157,
  salarioBaseReferencia: 690,
  muestraPiloto: 50,
  muestraLevantamiento: 960,
  incentivoUnitarioPiloto: 3.5,
  incentivoUnitarioEvaluacion: 3.5,
};

export function calculateReferenceSalary(config: QuoteConfig): number {
  return config.salarioBaseReferencia * (1 + config.ratioIncrementoPago) * config.tasaCambio / 26.8;
}

export function calculateReducedSalary(config: QuoteConfig): number {
  return config.salarioBaseReferencia * (1 + config.ratioIncrementoPago - config.ratioDescuentoDiaReducido) * config.tasaCambio / 26.8;
}

export interface LineCostInput {
  cantidadPersonas: number;
  diasTrabajados: number;
  costoUnitario: number;
}

export interface PhaseTableRowInput {
  quantity: number;
  days: number;
  unitPrice: number;
  baseUnitPrice?: number;
  salaryPerDay?: number;
}

export interface PhaseTableRowResult extends PhaseTableRowInput {
  totalUsd: number;
  totalLocal: number;
  internalCostUsd: number;
}

export interface PhaseTableResult {
  phaseName: string;
  subtotalUsd: number;
  subtotalLocal: number;
  internalCostUsd: number;
  rows: PhaseTableRowResult[];
}

export function calculateLineCost(input: LineCostInput): number {
  return input.cantidadPersonas * input.diasTrabajados * input.costoUnitario;
}

export function calculatePhaseTable(input: { phaseName: string; exchangeRate: number; rows: PhaseTableRowInput[] }): PhaseTableResult {
  const rows = input.rows.map((row) => {
    const totalUsd = calculateLineCost({
      cantidadPersonas: row.quantity,
      diasTrabajados: row.days,
      costoUnitario: row.unitPrice,
    });

    const totalLocal = totalUsd * input.exchangeRate;
    const internalCostUsd =
      row.baseUnitPrice && row.salaryPerDay && row.baseUnitPrice !== 0
        ? row.quantity * row.days * (row.unitPrice / row.baseUnitPrice) * row.salaryPerDay
        : 0;

    return {
      ...row,
      totalUsd,
      totalLocal,
      internalCostUsd,
    };
  });

  const subtotalUsd = rows.reduce((acc, row) => acc + row.totalUsd, 0);
  const subtotalLocal = rows.reduce((acc, row) => acc + row.totalLocal, 0);
  const internalCostUsd = rows.reduce((acc, row) => acc + row.internalCostUsd, 0);

  return {
    phaseName: input.phaseName,
    subtotalUsd,
    subtotalLocal,
    internalCostUsd,
    rows,
  };
}

export interface QuoteTableSummaryInput {
  exchangeRate: number;
  incentivesUsd: number;
  phases: Array<{
    phaseName: string;
    exchangeRate?: number;
    rows: PhaseTableRowInput[];
  }>;
}

export interface QuoteTableSummaryResult {
  totalOperationUsd: number;
  totalUsd: number;
  totalInternalCostUsd: number;
  marginValueUsd: number;
  marginPercent: number;
}

export function calculateQuoteTableSummary(input: QuoteTableSummaryInput): QuoteTableSummaryResult {
  const phaseResults = input.phases.map((phase) =>
    calculatePhaseTable({
      phaseName: phase.phaseName,
      exchangeRate: phase.exchangeRate ?? input.exchangeRate,
      rows: phase.rows,
    })
  );

  const totalOperationUsd = phaseResults.reduce((acc, phase) => acc + phase.subtotalUsd, 0);
  const totalInternalCostUsd = phaseResults.reduce((acc, phase) => acc + phase.internalCostUsd, 0);
  const totalUsd = totalOperationUsd + input.incentivesUsd;
  const marginValueUsd = totalUsd - totalInternalCostUsd;
  const marginPercent = totalUsd === 0 ? 0 : marginValueUsd / totalUsd;

  return {
    totalOperationUsd,
    totalUsd,
    totalInternalCostUsd,
    marginValueUsd,
    marginPercent,
  };
}

export interface ProductivityInput {
  tamanoMuestra: number;
  efectividadBase: number;
  numeroIntentos: number;
  tiempoEntreIntentos: number;
  tiempoEncuesta: number;
  horasLaborales: number;
  cantidadEquipo: number;
  margenError: number;
  diasPorSemana: number;
  muestraPiloto: number;
}

export interface ProductivityResult {
  tamanoBase: number;
  tiempoEjecucion: number;
  diasProductividad: number;
  diasPropuestos: number;
  productividadDiaria: number;
  intentosDiarios: number;
  workWeeks: number;
}

export function calculateProductivity(input: ProductivityInput): ProductivityResult {
  const tamanoBase = input.tamanoMuestra / input.efectividadBase;
  const tiempoEjecucion =
    (input.efectividadBase * (input.numeroIntentos - 1) * input.tiempoEntreIntentos + input.tamanoMuestra * input.tiempoEncuesta) /
    (input.horasLaborales * 60);

  const diasProductividad = Math.ceil(tiempoEjecucion / input.cantidadEquipo);
  const diasPropuestos = Math.ceil(diasProductividad * (1 + input.margenError));
  const productividadDiaria = input.tamanoMuestra / tiempoEjecucion;
  const intentosDiarios = (input.horasLaborales * 60 - productividadDiaria * input.tiempoEncuesta) / input.tiempoEntreIntentos;
  const workWeeks = tiempoEjecucion / input.diasPorSemana;

  return {
    tamanoBase,
    tiempoEjecucion,
    diasProductividad,
    diasPropuestos,
    productividadDiaria,
    intentosDiarios,
    workWeeks,
  };
}

export interface IncentivesInput {
  muestraPiloto: number;
  muestraLevantamiento: number;
  incentivoUnitarioPiloto: number;
  incentivoUnitarioEvaluacion: number;
}

export interface IncentivesResult {
  incentivoPiloto: number;
  incentivoEvaluacion: number;
  incentivoTotal: number;
}

export function calculateIncentives(input: IncentivesInput): IncentivesResult {
  const incentivoPiloto = input.muestraPiloto * input.incentivoUnitarioPiloto;
  const incentivoEvaluacion = input.muestraLevantamiento * input.incentivoUnitarioEvaluacion;
  const incentivoTotal = incentivoPiloto + incentivoEvaluacion;

  return {
    incentivoPiloto,
    incentivoEvaluacion,
    incentivoTotal,
  };
}
