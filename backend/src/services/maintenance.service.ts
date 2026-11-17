import { createCrudService } from './crudFactory';
import {
  CatalogItem,
  Client,
  CostCategory,
  Country,
  CountryCalculationSetting,
  CountryIncentive,
  Currency,
  Phase,
  PhaseItem,
  CalculationRule,
  TeamConfiguration,
  TeamConfigurationItem,
  WorkPlanAssignment,
} from '../models';
import { buildCountryCompletionStatus } from './countryConfig.service';
import { ApiError } from '../utils/ApiError';

const countryCrud = createCrudService(Country, 'País');
export const countryService = {
  ...countryCrud,
  async create(data: any) {
    const country = await Country.create(data);
    const existing = await CountryCalculationSetting.findOne({ where: { countryId: country.id } });
    if (!existing) {
      const config = buildCountryCompletionStatus({
        paymentIncreaseRatio: data.paymentIncreaseRatio ?? null,
        reducedDayDiscountRatio: data.reducedDayDiscountRatio ?? null,
        referenceDailySalaryLocal: data.referenceDailySalaryLocal ?? null,
        exchangeRate: data.exchangeRate ?? null,
      });

      await CountryCalculationSetting.create({
        countryId: country.id,
        paymentIncreaseRatio: data.paymentIncreaseRatio ?? null,
        reducedDayDiscountRatio: data.reducedDayDiscountRatio ?? null,
        exchangeRate: data.exchangeRate ?? null,
        referenceDailySalaryLocal: data.referenceDailySalaryLocal ?? null,
        referenceDailySalaryUsd: data.referenceDailySalaryUsd ?? null,
        currencyCode: data.currencyCode ?? null,
        isConfigured: config.isConfigured,
        active: true,
      });
    }
    return country;
  },
  async getById(id: number) {
    const country = await Country.findByPk(id, { include: [{ model: CountryCalculationSetting, as: 'calculationSettings' }] });
    if (!country) throw ApiError.notFound('País no encontrado');
    return country;
  },
  async list() {
    return Country.findAll({ order: [['id', 'ASC']], include: [{ model: CountryCalculationSetting, as: 'calculationSettings' }] });
  },
};

export const currencyService = createCrudService(Currency, 'Moneda');
export const clientService = createCrudService(Client, 'Cliente');
export const phaseService = createCrudService(Phase, 'Fase');
export const costCategoryService = createCrudService(CostCategory, 'Categoría de costo');
export const catalogItemService = createCrudService(CatalogItem, 'Concepto de costo');
export const phaseItemService = createCrudService(PhaseItem, 'Asociación fase-concepto');
export const calculationRuleService = createCrudService(CalculationRule, 'Regla de cálculo');

export const countryCalculationSettingService = {
  ...createCrudService(CountryCalculationSetting, 'Configuración del país'),
  async create(data: any) {
    const prepared = {
      ...data,
      paymentIncreaseRatio: data.paymentIncreaseRatio ?? null,
      reducedDayDiscountRatio: data.reducedDayDiscountRatio ?? null,
      exchangeRate: data.exchangeRate ?? null,
      referenceDailySalaryLocal: data.referenceDailySalaryLocal ?? null,
      referenceDailySalaryUsd: data.referenceDailySalaryUsd ?? null,
      currencyCode: data.currencyCode ?? null,
      active: data.active ?? true,
    };
    const status = buildCountryCompletionStatus(prepared);
    return CountryCalculationSetting.create({
      ...prepared,
      isConfigured: status.isConfigured,
    });
  },
  async update(id: number, data: any) {
    const record = await CountryCalculationSetting.findByPk(id);
    if (!record) throw ApiError.notFound('Configuración del país no encontrada');

    const merged = {
      ...record.toJSON(),
      ...data,
      paymentIncreaseRatio: data.paymentIncreaseRatio ?? record.paymentIncreaseRatio ?? null,
      reducedDayDiscountRatio: data.reducedDayDiscountRatio ?? record.reducedDayDiscountRatio ?? null,
      exchangeRate: data.exchangeRate ?? record.exchangeRate ?? null,
      referenceDailySalaryLocal: data.referenceDailySalaryLocal ?? record.referenceDailySalaryLocal ?? null,
      referenceDailySalaryUsd: data.referenceDailySalaryUsd ?? record.referenceDailySalaryUsd ?? null,
      currencyCode: data.currencyCode ?? record.currencyCode ?? null,
    };

    const status = buildCountryCompletionStatus(merged);
    await record.update({ ...merged, isConfigured: status.isConfigured });
    return record;
  },
};

export const countryIncentiveService = createCrudService(CountryIncentive, 'Incentivo por país');
export const workPlanAssignmentService = createCrudService(WorkPlanAssignment, 'Plan de trabajo');
export const teamConfigurationService = createCrudService(TeamConfiguration, 'Equipo por fase');
export const teamConfigurationItemService = createCrudService(TeamConfigurationItem, 'Rol del equipo');
