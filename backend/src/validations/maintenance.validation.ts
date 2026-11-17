import { z } from 'zod';

export const currencySchema = z.object({
  code: z.string().min(2).max(10),
  name: z.string().min(2),
  symbol: z.string().min(1).max(10),
});

export const countrySchema = z.object({
  name: z.string().min(2),
  iso2: z.string().length(2),
  iso3: z.string().length(3),
  currencyId: z.number().int().positive(),
  isDefault: z.boolean().optional(),
  paymentIncreaseRatio: z.number().min(0).optional(),
  reducedDayDiscountRatio: z.number().min(0).optional(),
  exchangeRate: z.number().positive().optional(),
  referenceDailySalaryLocal: z.number().nonnegative().optional(),
  referenceDailySalaryUsd: z.number().nonnegative().optional(),
  currencyCode: z.string().min(2).max(10).optional(),
});

export const countryCalculationSettingSchema = z.object({
  countryId: z.number().int().positive(),
  paymentIncreaseRatio: z.number().min(0).nullable().optional(),
  reducedDayDiscountRatio: z.number().min(0).nullable().optional(),
  exchangeRate: z.number().positive().nullable().optional(),
  referenceDailySalaryLocal: z.number().nonnegative().nullable().optional(),
  referenceDailySalaryUsd: z.number().nonnegative().nullable().optional(),
  currencyCode: z.string().min(2).max(10).nullable().optional(),
  isConfigured: z.boolean().optional(),
  active: z.boolean().optional(),
});

export const countryIncentiveSchema = z.object({
  countryId: z.number().int().positive(),
  type: z.enum(['PILOTO', 'EVALUACION']),
  unitValueUsd: z.number().nonnegative(),
  currencyCode: z.string().min(2).max(10).default('USD'),
  active: z.boolean().optional(),
});

export const workPlanAssignmentSchema = z.object({
  countryId: z.number().int().positive(),
  phaseId: z.number().int().positive(),
  roleId: z.number().int().positive(),
  quantity: z.number().nonnegative(),
  active: z.boolean().optional(),
});

export const teamConfigurationSchema = z.object({
  countryId: z.number().int().positive(),
  phaseId: z.number().int().positive(),
  teamType: z.enum(['LOCAL', 'FOREIGN']),
  active: z.boolean().optional(),
});

export const teamConfigurationItemSchema = z.object({
  teamConfigurationId: z.number().int().positive(),
  roleId: z.number().int().positive(),
  quantity: z.number().nonnegative(),
  active: z.boolean().optional(),
});

export const exchangeRateSchema = z.object({
  countryId: z.number().int().positive(),
  baseCurrencyId: z.number().int().positive(),
  targetCurrencyId: z.number().int().positive(),
  rate: z.number().positive(),
  validFrom: z.string(),
});

export const clientSchema = z.object({
  countryId: z.number().int().positive(),
  name: z.string().min(2),
  legalName: z.string().optional(),
  taxId: z.string().optional(),
  contactName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const phaseSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  sortOrder: z.number().int().optional(),
});

export const costCategorySchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
});

export const catalogItemSchema = z.object({
  categoryId: z.number().int().positive(),
  name: z.string().min(2),
  code: z.string().min(2),
  unitLabel: z.string().optional(),
});

export const phaseItemSchema = z.object({
  phaseId: z.number().int().positive(),
  catalogItemId: z.number().int().positive(),
});

export const countryItemPriceSchema = z.object({
  countryId: z.number().int().positive(),
  phaseItemId: z.number().int().positive(),
  unitPriceUsd: z.number().nonnegative(),
  validFrom: z.string(),
});

export const calculationRuleSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  ruleType: z.enum([
    'LINE_TOTAL',
    'CEIL_RATIO',
    'PERCENT_OF_DAYS',
    'UNIT_COST_DELTA',
    'REFERENCE_SALARY',
    'INTERNAL_COST_NORMALIZED',
    'SAMPLE_SIZING',
    'PROPORTIONAL_DATA_COST',
    'EXPECTED_MARGIN',
  ]),
  paramsJson: z.record(z.unknown()),
  phaseItemId: z.number().int().positive().nullable().optional(),
});
