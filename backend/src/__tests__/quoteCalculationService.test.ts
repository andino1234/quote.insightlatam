import {
  DEFAULT_QUOTE_CONFIG,
  calculateIncentives,
  calculateLineCost,
  calculatePhaseTable,
  calculateProductivity,
  calculateQuoteTableSummary,
  calculateReferenceSalary,
  calculateReducedSalary,
} from '../services/quoteCalculation.service';

describe('quoteCalculationService', () => {
  test('usa la configuración base del Excel', () => {
    expect(DEFAULT_QUOTE_CONFIG.pais).toBe('Jamaica');
    expect(DEFAULT_QUOTE_CONFIG.ratioIncrementoPago).toBeCloseTo(0.22);
    expect(DEFAULT_QUOTE_CONFIG.ratioDescuentoDiaReducido).toBeCloseTo(0.3);
    expect(DEFAULT_QUOTE_CONFIG.tasaCambio).toBe(157);
    expect(DEFAULT_QUOTE_CONFIG.salarioBaseReferencia).toBe(690);
  });

  test('calcula salario referencia diario y reducido con la fórmula del Excel', () => {
    const referencia = calculateReferenceSalary(DEFAULT_QUOTE_CONFIG);
    const reducido = calculateReducedSalary(DEFAULT_QUOTE_CONFIG);

    expect(referencia).toBeCloseTo(690 * (1 + 0.22) * 157 / 26.8, 5);
    expect(reducido).toBeCloseTo(690 * (1 + 0.22 - 0.3) * 157 / 26.8, 5);
  });

  test('calcula la productividad del motor F2F sin hardcodear fórmulas en componentes', () => {
    const result = calculateProductivity({
      tamanoMuestra: 960,
      efectividadBase: 0.85,
      numeroIntentos: 4,
      tiempoEntreIntentos: 20,
      tiempoEncuesta: 8,
      horasLaborales: 8,
      cantidadEquipo: 12,
      margenError: 0.15,
      diasPorSemana: 5,
      muestraPiloto: 50,
    });

    expect(result.tamanoBase).toBeCloseTo(960 / 0.85, 5);
    expect(result.productividadDiaria).toBeGreaterThan(0);
    expect(result.diasPropuestos).toBeGreaterThan(0);
    expect(result.productividadDiaria).toBeCloseTo(960 / result.tiempoEjecucion, 5);
  });

  test('calcula costos por línea e incentivos según la lógica del Excel', () => {
    const costoLinea = calculateLineCost({ cantidadPersonas: 12, diasTrabajados: 3, costoUnitario: 24 });
    expect(costoLinea).toBe(864);

    const incentivos = calculateIncentives({
      muestraPiloto: 50,
      muestraLevantamiento: 960,
      incentivoUnitarioPiloto: 3.5,
      incentivoUnitarioEvaluacion: 3.5,
    });

    expect(incentivos.incentivoPiloto).toBe(175);
    expect(incentivos.incentivoEvaluacion).toBe(3360);
    expect(incentivos.incentivoTotal).toBe(3535);
  });

  test('calcula el subtotal por fase y el costo interno según la tabla del Excel', () => {
    const result = calculatePhaseTable({
      phaseName: 'Reclutamiento',
      exchangeRate: 157,
      rows: [
        { quantity: 2, days: 5, unitPrice: 24, baseUnitPrice: 24, salaryPerDay: 31.4 },
        { quantity: 1, days: 3, unitPrice: 18, baseUnitPrice: 24, salaryPerDay: 31.4 },
      ],
    });

    expect(result.subtotalUsd).toBeCloseTo(2 * 5 * 24 + 1 * 3 * 18, 5);
    expect(result.subtotalLocal).toBeCloseTo(result.subtotalUsd * 157, 5);
    expect(result.internalCostUsd).toBeGreaterThan(0);
  });

  test('calcula el resumen total de operación y margen con incentivos', () => {
    const result = calculateQuoteTableSummary({
      exchangeRate: 157,
      incentivesUsd: 3535,
      phases: [
        {
          phaseName: 'Reclutamiento',
          exchangeRate: 157,
          rows: [{ quantity: 2, days: 5, unitPrice: 24, baseUnitPrice: 24, salaryPerDay: 31.4 }],
        },
        {
          phaseName: 'Levantamiento',
          exchangeRate: 157,
          rows: [{ quantity: 12, days: 3, unitPrice: 28, baseUnitPrice: 28, salaryPerDay: 31.4 }],
        },
      ],
    });

    expect(result.totalOperationUsd).toBeCloseTo(240 + 1008, 5);
    expect(result.totalUsd).toBeCloseTo(240 + 1008 + 3535, 5);
    expect(result.marginValueUsd).toBeCloseTo(result.totalUsd - result.totalInternalCostUsd, 5);
    expect(result.marginPercent).toBeGreaterThanOrEqual(0);
  });
});
