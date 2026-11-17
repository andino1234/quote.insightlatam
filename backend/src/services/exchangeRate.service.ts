import { ExchangeRate } from '../models';
import { ApiError } from '../utils/ApiError';

interface CreateExchangeRateInput {
  countryId: number;
  baseCurrencyId: number;
  targetCurrencyId: number;
  rate: number;
  validFrom: string;
  createdBy: number;
}

/**
 * Mantenimiento de tasas de cambio con historial. Nunca se edita una tasa existente:
 * se cierra la vigente (`valid_to`) y se crea una nueva activa. Las cotizaciones ya creadas
 * guardan su propia copia (`quotes.exchange_rate_used`) y no se ven afectadas.
 */
export const exchangeRateService = {
  async list() {
    return ExchangeRate.findAll({ order: [['id', 'DESC']] });
  },

  async getActiveForCountry(countryId: number): Promise<ExchangeRate> {
    const rate = await ExchangeRate.findOne({ where: { countryId, active: true }, order: [['validFrom', 'DESC']] });
    if (!rate) throw ApiError.notFound('No hay una tasa de cambio activa para el país seleccionado');
    return rate;
  },

  async create(input: CreateExchangeRateInput) {
    await ExchangeRate.update(
      { active: false, validTo: input.validFrom },
      { where: { countryId: input.countryId, active: true } }
    );
    return ExchangeRate.create({
      countryId: input.countryId,
      baseCurrencyId: input.baseCurrencyId,
      targetCurrencyId: input.targetCurrencyId,
      rate: input.rate,
      validFrom: input.validFrom,
      validTo: null,
      active: true,
      createdBy: input.createdBy,
    });
  },

  async deactivate(id: number) {
    const rate = await ExchangeRate.findByPk(id);
    if (!rate) throw ApiError.notFound('Tasa de cambio no encontrada');
    await rate.update({ active: false, validTo: new Date().toISOString().slice(0, 10) });
    return rate;
  },
};
