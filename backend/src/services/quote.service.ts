import { QuoteCalculator } from '../engine/QuoteCalculator';
import { LineItemInput, PhaseInput } from '../engine/types';
import * as rules from '../engine/rules';
import { CatalogItem, Client, Country, CountryCalculationSetting, Phase, PhaseItem, Quote, QuoteCalculationLog, QuoteInput, QuoteItem, QuotePhase, QuoteSummaryLine } from '../models';
import { AppRole } from '../models/security.models';
import { ApiError } from '../utils/ApiError';
import { exchangeRateService } from './exchangeRate.service';
import { priceService } from './price.service';
import { sequelize } from '../config/database';
import { buildCountryCompletionStatus, buildCountrySalaryParams, getEffectiveExchangeRate } from './countryConfig.service';

type QuoteAccessRole = AppRole;

export interface QuoteItemInput {
  catalogItemId: number;
  quantity?: number;
  days?: number;
}
export interface QuotePhaseInputDto {
  phaseId: number;
  items: QuoteItemInput[];
}
export interface CreateQuoteDto {
  clientId: number;
  countryId: number;
  title: string;
  description?: string;
  sampleSize: number;
  validUntil?: string;
  incentivesUsd?: number;
  phases: QuotePhaseInputDto[];
}

/**
 * Servicio de cotizaciones. Resuelve mantenimientos vigentes (precios, tasa de cambio),
 * ejecuta el motor de cálculo y persiste snapshots inmutables (quote_items, quote_phases,
 * quote_summary_lines) para que cambios futuros en mantenimientos no alteren cotizaciones existentes.
 */
async function resolveQuoteCalculation(countryId: number, phases: QuotePhaseInputDto[], incentivesUsd = 0) {
  const country = await Country.findByPk(countryId);
  if (!country) throw ApiError.notFound('País no encontrado');

  const countrySettings = await CountryCalculationSetting.findOne({ where: { countryId, active: true } });
  const configStatus = buildCountryCompletionStatus({
    paymentIncreaseRatio: countrySettings?.paymentIncreaseRatio ?? null,
    reducedDayDiscountRatio: countrySettings?.reducedDayDiscountRatio ?? null,
    exchangeRate: countrySettings?.exchangeRate ?? null,
    referenceDailySalaryLocal: countrySettings?.referenceDailySalaryLocal ?? null,
    referenceDailySalaryUsd: countrySettings?.referenceDailySalaryUsd ?? null,
  });

  if (!configStatus.isConfigured) {
    throw ApiError.badRequest(
      `La configuración del país está incompleta: ${configStatus.missingFields.join(', ')}. Completa los valores en Mantenimiento > Países.`
    );
  }

  let activeRate = null;
  try {
    activeRate = await exchangeRateService.getActiveForCountry(countryId);
  } catch {
    activeRate = null;
  }

  const effectiveRate = getEffectiveExchangeRate(activeRate ? Number(activeRate.rate) : null, countrySettings?.exchangeRate ?? null);
  const salaryParams = buildCountrySalaryParams({
    paymentIncreaseRatio: countrySettings?.paymentIncreaseRatio ?? null,
    reducedDayDiscountRatio: countrySettings?.reducedDayDiscountRatio ?? null,
    exchangeRate: countrySettings?.exchangeRate ?? null,
    referenceDailySalaryLocal: countrySettings?.referenceDailySalaryLocal ?? null,
    referenceDailySalaryUsd: countrySettings?.referenceDailySalaryUsd ?? null,
  });

  const phaseInputs: PhaseInput[] = [];
  for (const phaseDto of phases) {
    const phase = await Phase.findByPk(phaseDto.phaseId);
    if (!phase) throw ApiError.notFound(`Fase ${phaseDto.phaseId} no encontrada`);

    const phaseItems = await PhaseItem.findAll({
      where: { phaseId: phase.id, active: true },
      include: [{ model: CatalogItem, as: 'catalogItem' }],
    });

    const inputByCatalogItem = new Map(phaseDto.items.map((i) => [i.catalogItemId, i]));
    const lineItems: LineItemInput[] = [];
    let baseUnitPrice = 0;

    for (const pi of phaseItems) {
      const catalogItem = (pi as any).catalogItem as CatalogItem;
      const input = inputByCatalogItem.get(catalogItem.id);
      if (!input) continue;

      const priceRecord = await priceService.getActive(countryId, pi.id);
      const unitPriceUsd = Number(priceRecord.unitPriceUsd);
      if (catalogItem.code.includes('ENCUESTADOR')) baseUnitPrice = unitPriceUsd;

      lineItems.push({
        catalogItemId: catalogItem.id,
        itemName: catalogItem.name,
        categoryCode: String(catalogItem.categoryId),
        quantity: input.quantity ?? 0,
        days: input.days ?? 0,
        unitPriceUsd,
      });
    }

    const salaryPerDay = rules.reducedSalaryPerDay(salaryParams);
    lineItems.forEach((li) => {
      li.baseUnitPriceUsd = baseUnitPrice || li.unitPriceUsd;
      li.referenceSalaryPerDay = salaryPerDay;
    });

    phaseInputs.push({ phaseId: phase.id, phaseCode: phase.code, phaseName: phase.name, sortOrder: phase.sortOrder, items: lineItems });
  }

  const calculation = QuoteCalculator.calculate({
    exchangeRate: effectiveRate,
    phases: phaseInputs,
    incentivesUsd: incentivesUsd ?? 0,
  });

  return { country, calculation, effectiveRate };
}

export const quoteService = {
  async listForUser(userId: number, role: QuoteAccessRole) {
    const where = role === 'ADMINISTRADOR' || role === 'GERENCIA' ? {} : { executiveId: userId };
    return Quote.findAll({ where, include: [{ model: Client, as: 'client' }, { model: Country, as: 'country' }], order: [['id', 'DESC']] });
  },

  async getById(id: number, userId: number, role: QuoteAccessRole) {
    const quote = await Quote.findByPk(id, {
      include: [
        { model: Client, as: 'client' },
        { model: Country, as: 'country' },
        { model: QuotePhase, as: 'phases', include: [{ model: QuoteItem, as: 'items' }] },
        { model: QuoteSummaryLine, as: 'summaryLines' },
        { model: QuoteInput, as: 'inputs' },
      ],
    });
    if (!quote) throw ApiError.notFound('Cotización no encontrada');
    this.assertOwnership(quote, userId, role);
    return quote;
  },

  assertOwnership(quote: Quote, userId: number, role: QuoteAccessRole) {
    if (role !== 'ADMINISTRADOR' && role !== 'GERENCIA' && quote.executiveId !== userId) {
      throw ApiError.forbidden('No tiene permisos para acceder a esta cotización');
    }
  },

  async create(dto: CreateQuoteDto, executiveId: number) {
    const { country, calculation, effectiveRate } = await resolveQuoteCalculation(dto.countryId, dto.phases, dto.incentivesUsd ?? 0);

    const quoteId = await sequelize.transaction(async (t) => {
      const quoteNumber = `COT-${Date.now()}`;
      const quote = await Quote.create(
        {
          quoteNumber,
          version: 1,
          parentQuoteId: null,
          clientId: dto.clientId,
          countryId: dto.countryId,
          currencyId: country.currencyId,
          exchangeRateUsed: effectiveRate,
          executiveId,
          title: dto.title,
          description: dto.description ?? null,
          sampleSize: dto.sampleSize,
          marginPercent: calculation.marginPercent,
          status: 'BORRADOR',
          validUntil: dto.validUntil ?? null,
        },
        { transaction: t }
      );

      for (const phaseResult of calculation.phases) {
        const quotePhase = await QuotePhase.create(
          {
            quoteId: quote.id,
            phaseId: phaseResult.phaseId,
            phaseNameSnapshot: phaseResult.phaseName,
            sortOrder: phaseResult.sortOrder,
            subtotalUsd: phaseResult.subtotalUsd,
            subtotalLocal: phaseResult.subtotalLocal,
          },
          { transaction: t }
        );

        for (const item of phaseResult.items) {
          await QuoteItem.create(
            {
              quotePhaseId: quotePhase.id,
              catalogItemId: item.catalogItemId,
              itemNameSnapshot: item.itemName,
              categorySnapshot: item.categoryCode,
              quantity: item.quantity,
              days: item.days,
              unitPriceUsdSnapshot: item.unitPriceUsd,
              totalUsd: item.totalUsd,
              totalLocal: item.totalLocal,
              internalCostUsdSnapshot: item.internalCostUsd,
              ruleSnapshotJson: item.ruleSnapshot,
            },
            { transaction: t }
          );
        }
      }

      let order = 0;
      for (const line of calculation.summary) {
        await QuoteSummaryLine.create(
          { quoteId: quote.id, label: line.label, valueUsd: line.valueUsd, valueLocal: line.valueLocal, kind: line.kind, sortOrder: order++ },
          { transaction: t }
        );
      }

      await QuoteCalculationLog.create(
        { quoteId: quote.id, inputSnapshotJson: dto as unknown as Record<string, unknown>, outputSnapshotJson: calculation as unknown as Record<string, unknown> },
        { transaction: t }
      );

      return quote.id;
    });

    return this.getById(quoteId, executiveId, 'ADMINISTRADOR');
  },

  async update(
    id: number,
    dto: {
      clientId?: number;
      countryId?: number;
      title?: string;
      description?: string | null;
      sampleSize?: number;
      validUntil?: string | null;
      status?: Quote['status'];
      phases?: QuotePhaseInputDto[];
    },
    userId: number,
    role: QuoteAccessRole
  ) {
    const quote = await Quote.findByPk(id);
    if (!quote) throw ApiError.notFound('Cotización no encontrada');
    this.assertOwnership(quote, userId, role);

    const updates: Partial<Quote> = {};
    if (dto.clientId) updates.clientId = dto.clientId;
    if (dto.countryId) updates.countryId = dto.countryId;
    if (dto.title) updates.title = dto.title;
    if (dto.description !== undefined) updates.description = dto.description ?? null;
    if (dto.sampleSize !== undefined) updates.sampleSize = dto.sampleSize;
    if (dto.validUntil !== undefined) updates.validUntil = dto.validUntil ?? null;
    if (dto.status) updates.status = dto.status;

    if (dto.phases && dto.phases.length > 0) {
      const countryId = dto.countryId ?? quote.countryId;
      const { calculation, effectiveRate } = await resolveQuoteCalculation(countryId, dto.phases, 0);

      await QuoteSummaryLine.destroy({ where: { quoteId: id } });
      await QuoteCalculationLog.destroy({ where: { quoteId: id } });
      await QuoteItem.destroy({ where: { quotePhaseId: (await QuotePhase.findAll({ where: { quoteId: id }, attributes: ['id'] })).map((phase) => phase.id) } });
      await QuotePhase.destroy({ where: { quoteId: id } });

      for (const phaseResult of calculation.phases) {
        const quotePhase = await QuotePhase.create({
          quoteId: id,
          phaseId: phaseResult.phaseId,
          phaseNameSnapshot: phaseResult.phaseName,
          sortOrder: phaseResult.sortOrder,
          subtotalUsd: phaseResult.subtotalUsd,
          subtotalLocal: phaseResult.subtotalLocal,
        });

        for (const item of phaseResult.items) {
          await QuoteItem.create({
            quotePhaseId: quotePhase.id,
            catalogItemId: item.catalogItemId,
            itemNameSnapshot: item.itemName,
            categorySnapshot: item.categoryCode,
            quantity: item.quantity,
            days: item.days,
            unitPriceUsdSnapshot: item.unitPriceUsd,
            totalUsd: item.totalUsd,
            totalLocal: item.totalLocal,
            internalCostUsdSnapshot: item.internalCostUsd,
            ruleSnapshotJson: item.ruleSnapshot,
          });
        }
      }

      let order = 0;
      for (const line of calculation.summary) {
        await QuoteSummaryLine.create({
          quoteId: id,
          label: line.label,
          valueUsd: line.valueUsd,
          valueLocal: line.valueLocal,
          kind: line.kind,
          sortOrder: order++,
        });
      }

      await QuoteCalculationLog.create({
        quoteId: id,
        inputSnapshotJson: { phases: dto.phases } as Record<string, unknown>,
        outputSnapshotJson: calculation as unknown as Record<string, unknown>,
      });

      updates.marginPercent = calculation.marginPercent;
      updates.exchangeRateUsed = effectiveRate;
      updates.countryId = countryId;
    }

    if (Object.keys(updates).length > 0) {
      await quote.update(updates);
    }

    return this.getById(id, userId, role);
  },

  async delete(id: number, userId: number, role: QuoteAccessRole) {
    const quote = await Quote.findByPk(id);
    if (!quote) throw ApiError.notFound('Cotización no encontrada');
    this.assertOwnership(quote, userId, role);

    await QuoteSummaryLine.destroy({ where: { quoteId: id } });
    await QuoteCalculationLog.destroy({ where: { quoteId: id } });
    await QuoteItem.destroy({ where: { quotePhaseId: (await QuotePhase.findAll({ where: { quoteId: id }, attributes: ['id'] })).map((phase) => phase.id) } });
    await QuotePhase.destroy({ where: { quoteId: id } });
    await quote.destroy();
  },

  async duplicate(id: number, executiveId: number, role: QuoteAccessRole) {
    const original = await this.getById(id, executiveId, role);
    const phasesDto: QuotePhaseInputDto[] = (original as any).phases.map((qp: any) => ({
      phaseId: qp.phaseId,
      items: qp.items.map((qi: any) => ({ catalogItemId: qi.catalogItemId, quantity: Number(qi.quantity), days: Number(qi.days) })),
    }));
    const duplicated = await this.create(
      {
        clientId: original.clientId,
        countryId: original.countryId,
        title: `${original.title} (copia)`,
        description: original.description ?? undefined,
        sampleSize: Number(original.sampleSize),
        validUntil: original.validUntil ?? undefined,
        phases: phasesDto,
      },
      executiveId
    );
    await Quote.update({ parentQuoteId: original.id }, { where: { id: (duplicated as any).id } });
    return this.getById((duplicated as any).id, executiveId, role);
  },

  async updateStatus(id: number, status: Quote['status'], userId: number, role: QuoteAccessRole) {
    const quote = await Quote.findByPk(id);
    if (!quote) throw ApiError.notFound('Cotización no encontrada');
    this.assertOwnership(quote, userId, role);

    await quote.update({ status });
    return this.getById(id, userId, role);
  },
};
