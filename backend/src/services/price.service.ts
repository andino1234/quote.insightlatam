import { CountryItemPrice } from '../models';
import { ApiError } from '../utils/ApiError';

interface CreatePriceInput {
  countryId: number;
  phaseItemId: number;
  unitPriceUsd: number;
  validFrom: string;
  createdBy: number;
}

/**
 * Mantenimiento de precios por país/concepto con historial (igual filosofía que exchange_rates).
 * Al crear un precio nuevo se cierra el anterior vigente para ese país+concepto.
 */
export const priceService = {
  async list() {
    return CountryItemPrice.findAll({ order: [['id', 'DESC']] });
  },

  async getActive(countryId: number, phaseItemId: number): Promise<CountryItemPrice> {
    const price = await CountryItemPrice.findOne({ where: { countryId, phaseItemId, active: true }, order: [['validFrom', 'DESC']] });
    if (!price) throw ApiError.notFound('No hay un precio activo configurado para este concepto en el país seleccionado');
    return price;
  },

  async create(input: CreatePriceInput) {
    await CountryItemPrice.update(
      { active: false, validTo: input.validFrom },
      { where: { countryId: input.countryId, phaseItemId: input.phaseItemId, active: true } }
    );
    return CountryItemPrice.create({
      countryId: input.countryId,
      phaseItemId: input.phaseItemId,
      unitPriceUsd: input.unitPriceUsd,
      validFrom: input.validFrom,
      validTo: null,
      active: true,
      createdBy: input.createdBy,
    });
  },

  async update(id: number, input: Partial<CreatePriceInput>) {
    const price = await CountryItemPrice.findByPk(id);
    if (!price) throw ApiError.notFound('Precio no encontrado');

    await price.update({
      ...(input.countryId !== undefined ? { countryId: input.countryId } : {}),
      ...(input.phaseItemId !== undefined ? { phaseItemId: input.phaseItemId } : {}),
      ...(input.unitPriceUsd !== undefined ? { unitPriceUsd: input.unitPriceUsd } : {}),
      ...(input.validFrom !== undefined ? { validFrom: input.validFrom } : {}),
    });

    return price;
  },

  async deactivate(id: number) {
    const price = await CountryItemPrice.findByPk(id);
    if (!price) throw ApiError.notFound('Precio no encontrado');
    await price.update({ active: false, validTo: new Date().toISOString().slice(0, 10) });
    return price;
  },
};
