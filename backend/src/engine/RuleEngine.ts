import * as rules from './rules';
import { RuleType, SalaryParams, SizingParams } from './types';

/**
 * Motor de reglas configurable: despacha una regla (código + parámetros JSON provenientes de
 * `calculation_rules`) hacia la función pura correspondiente. Permite que el administrador
 * configure ratios/porcentajes/deltas sin tocar código.
 */
export class RuleEngine {
  static apply(ruleType: RuleType, params: Record<string, unknown>, context: Record<string, number>): number | Record<string, number> {
    switch (ruleType) {
      case 'LINE_TOTAL':
        return rules.lineTotal(context.quantity, context.days, context.unitPrice);

      case 'CEIL_RATIO':
        return rules.ceilRatio(context.baseQuantity, Number(params.ratio));

      case 'PERCENT_OF_DAYS':
        return rules.percentOfDays(context.baseDays, Number(params.percent));

      case 'UNIT_COST_DELTA':
        return rules.unitCostDelta(context.baseUnitPrice, Number(params.delta));

      case 'REFERENCE_SALARY':
        return rules.referenceSalaryPerDay(params as unknown as SalaryParams);

      case 'INTERNAL_COST_NORMALIZED':
        return rules.internalCostNormalized(
          context.quantity,
          context.days,
          context.unitPrice,
          context.baseUnitPrice,
          context.salaryPerDay
        );

      case 'SAMPLE_SIZING':
        return rules.sampleSizing(params as unknown as SizingParams) as unknown as Record<string, number>;

      case 'PROPORTIONAL_DATA_COST':
        return rules.proportionalDataCost(context.dataCostTotal, context.sumInternalCosts, context.sumExternalCosts);

      case 'EXPECTED_MARGIN': {
        const result = rules.expectedMargin(context.totalQuoted, context.totalInternalCost);
        return { marginValue: result.marginValue, marginPercent: result.marginPercent };
      }

      default:
        throw new Error(`Tipo de regla no soportado: ${ruleType}`);
    }
  }
}
