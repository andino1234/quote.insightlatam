import * as rules from './rules';
import {
  LineItemInput,
  LineItemResult,
  PhaseInput,
  PhaseResult,
  QuoteCalculationInput,
  QuoteCalculationResult,
  SummaryLine,
} from './types';

/**
 * Orquesta el cálculo completo de una cotización: fases -> ítems -> subtotales -> resumen.
 * No conoce HTTP ni la base de datos; recibe datos ya resueltos (cantidades/días/precios)
 * provenientes del servicio de cotizaciones, que sí conoce mantenimientos y reglas configuradas.
 */
export class QuoteCalculator {
  static calculate(input: QuoteCalculationInput): QuoteCalculationResult {
    const phaseResults: PhaseResult[] = input.phases
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((phase) => this.calculatePhase(phase, input.exchangeRate));

    const totalOperationUsd = phaseResults.reduce((acc, p) => acc + p.subtotalUsd, 0);
    const totalInternalCostUsd = phaseResults.reduce((acc, p) => acc + p.subtotalInternalCostUsd, 0);
    const totalUsd = totalOperationUsd + input.incentivesUsd;
    const { marginValue, marginPercent } = rules.expectedMargin(totalUsd, totalInternalCostUsd);

    const summary: SummaryLine[] = [
      { label: 'Total Operación', kind: 'TOTAL_OPERACION', valueUsd: totalOperationUsd, valueLocal: rules.toLocalCurrency(totalOperationUsd, input.exchangeRate) },
      { label: 'Incentivos', kind: 'INCENTIVOS', valueUsd: input.incentivesUsd, valueLocal: rules.toLocalCurrency(input.incentivesUsd, input.exchangeRate) },
      { label: 'Total', kind: 'TOTAL', valueUsd: totalUsd, valueLocal: rules.toLocalCurrency(totalUsd, input.exchangeRate) },
      {
        label: 'Costo interno estimado',
        kind: 'COSTO_INTERNO_TOTAL',
        valueUsd: totalInternalCostUsd,
        valueLocal: rules.toLocalCurrency(totalInternalCostUsd, input.exchangeRate),
      },
      {
        label: 'Margen esperado',
        kind: 'MARGEN_VALOR',
        valueUsd: marginValue,
        valueLocal: rules.toLocalCurrency(marginValue, input.exchangeRate),
      },
      { label: 'Margen esperado %', kind: 'MARGEN_PORCENTAJE', valueUsd: marginPercent * 100, valueLocal: marginPercent * 100 },
    ];

    return { phases: phaseResults, summary, totalOperationUsd, totalUsd, totalInternalCostUsd, marginValueUsd: marginValue, marginPercent };
  }

  private static calculatePhase(phase: PhaseInput, exchangeRate: number): PhaseResult {
    const items = phase.items.map((item) => this.calculateItem(item, exchangeRate));
    const subtotalUsd = items.reduce((acc, i) => acc + i.totalUsd, 0);
    const subtotalLocal = items.reduce((acc, i) => acc + i.totalLocal, 0);
    const subtotalInternalCostUsd = items.reduce((acc, i) => acc + i.internalCostUsd, 0);

    return {
      phaseId: phase.phaseId,
      phaseName: phase.phaseName,
      sortOrder: phase.sortOrder,
      items,
      subtotalUsd,
      subtotalLocal,
      subtotalInternalCostUsd,
    };
  }

  private static calculateItem(item: LineItemInput, exchangeRate: number): LineItemResult {
    const totalUsd = rules.lineTotal(item.quantity, item.days, item.unitPriceUsd);
    const totalLocal = rules.toLocalCurrency(totalUsd, exchangeRate);

    let internalCostUsd = 0;
    if (item.baseUnitPriceUsd && item.referenceSalaryPerDay) {
      internalCostUsd = rules.internalCostNormalized(item.quantity, item.days, item.unitPriceUsd, item.baseUnitPriceUsd, item.referenceSalaryPerDay);
    }

    return {
      ...item,
      totalUsd,
      totalLocal,
      internalCostUsd,
      ruleSnapshot: {
        rule: 'LINE_TOTAL',
        quantity: item.quantity,
        days: item.days,
        unitPriceUsd: item.unitPriceUsd,
        exchangeRate,
      },
    };
  }
}
