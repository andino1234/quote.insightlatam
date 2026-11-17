/**
 * Reglas de negocio puras traducidas del Excel (según Modelo Cotizador Excel.xlsx).
 * Cada función es independiente y testeable; ninguna referencia celdas de Excel directamente.
 */
import { SalaryParams, SizingParams, SizingResult } from './types';

/** total = cantidad * dias * costo_unitario  (Excel: C*D*E) */
export function lineTotal(quantity: number, days: number, unitPrice: number): number {
  return quantity * days * unitPrice;
}

/** cantidad_derivada = CEIL(cantidad_base / ratio)  (Excel: ROUNDUP(C4/5,0)) */
export function ceilRatio(baseQuantity: number, ratio: number): number {
  if (ratio <= 0) throw new Error('El ratio debe ser mayor a 0');
  return Math.ceil(baseQuantity / ratio);
}

/** dias_derivados = CEIL(dias_base * porcentaje)  (Excel: ROUNDUP(D4*0.5,0)) */
export function percentOfDays(baseDays: number, percent: number): number {
  return Math.ceil(baseDays * percent);
}

/** costo_unitario_rol = costo_unitario_base_fase + delta_rol  (Excel: =+E4+10) */
export function unitCostDelta(baseUnitPrice: number, delta: number): number {
  return baseUnitPrice + delta;
}

/** valor_moneda_local = valor_usd * tasa_cambio_vigente  (Excel: =+F4*$L$5) */
export function toLocalCurrency(valueUsd: number, exchangeRate: number): number {
  return valueUsd * exchangeRate;
}

/** salario_referencia_dia = (salario_base*(1+ratio_incremento)) / dias_mes  (Excel: =690*(1+L3)*L5/26.8 sin tasa, en USD) */
export function referenceSalaryPerDay(params: SalaryParams): number {
  return (params.baseMonthlySalary * (1 + params.incrementRatio)) / params.workingDaysPerMonth;
}

/** salario_reducido_dia = (salario_base*(1+ratio_incremento-ratio_descuento)) / dias_mes (Excel: =690*(1+L3-L4)*L5/26.8) */
export function reducedSalaryPerDay(params: SalaryParams): number {
  return (params.baseMonthlySalary * (1 + params.incrementRatio - params.reductionRatio)) / params.workingDaysPerMonth;
}

/**
 * costo_interno = cantidad * dias * (costo_unitario_rol / costo_unitario_base_fase) * salario_referencia
 * (Excel: =+C*D*(E/$E$4)*$L$7)
 */
export function internalCostNormalized(
  quantity: number,
  days: number,
  unitPrice: number,
  baseUnitPrice: number,
  salaryPerDay: number
): number {
  if (baseUnitPrice === 0) return 0;
  return quantity * days * (unitPrice / baseUnitPrice) * salaryPerDay;
}

/** base_contactos = tamaño_muestra / efectividad_base (Excel: =+W8/W7) */
export function sampleSizing(params: SizingParams): SizingResult {
  const baseUniverse = params.sampleSize / params.baseEffectiveness;
  // dias_persona = (base*(intentos-1)*tiempo_entre_intentos + muestra*tiempo_encuesta) / (horas_dia*60)
  const fieldDaysPerson =
    (baseUniverse * (params.attempts - 1) * params.minutesBetweenAttempts + params.sampleSize * params.surveyMinutes) /
    (params.workHoursDay * 60);
  // dias_ejecucion = CEIL(dias_persona / tamaño_equipo)
  const executionDaysByTeam = Math.ceil(fieldDaysPerson / params.teamSize);
  // productividad_diaria = muestra / dias_persona
  const dailyProductivity = params.sampleSize / fieldDaysPerson;
  // dias_propuestos = CEIL(dias_ejecucion * (1+margen_error))
  const proposedExecutionDays = Math.ceil(executionDaysByTeam * (1 + params.errorMargin));
  // intentos_diarios = (horas_dia*60 - productividad_diaria*tiempo_encuesta) / tiempo_entre_intentos
  const dailyAttempts = (params.workHoursDay * 60 - dailyProductivity * params.surveyMinutes) / params.minutesBetweenAttempts;
  // semanas = dias_ejecucion / dias_por_semana
  const workWeeks = executionDaysByTeam / params.daysPerWeek;

  return { baseUniverse, fieldDaysPerson, executionDaysByTeam, dailyProductivity, proposedExecutionDays, dailyAttempts, workWeeks };
}

/**
 * costo_datos_ajustado = costo_datos_total * (suma_costos_internos / suma_costos_externos)
 * (Excel: =+(F204)*(SUM(I13,I27,...)/SUM(F12,F26,...)))
 */
export function proportionalDataCost(dataCostTotal: number, sumInternalCosts: number, sumExternalCosts: number): number {
  if (sumExternalCosts === 0) return 0;
  return dataCostTotal * (sumInternalCosts / sumExternalCosts);
}

/** margen_valor = total - costo_interno; margen_pct = 1 - costo_interno/total (Excel: C218-C221, 1-C221/C218) */
export function expectedMargin(totalQuoted: number, totalInternalCost: number): { marginValue: number; marginPercent: number } {
  const marginValue = totalQuoted - totalInternalCost;
  const marginPercent = totalQuoted === 0 ? 0 : 1 - totalInternalCost / totalQuoted;
  return { marginValue, marginPercent };
}

/** costo_unitario_muestra = total / muestra_total (Excel: =+C218/$L$13) */
export function unitCostPerSample(total: number, totalSampleSize: number): number {
  if (totalSampleSize === 0) return 0;
  return total / totalSampleSize;
}
