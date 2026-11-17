import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Client, Country } from './geo.models';
import { User } from './security.models';
import { Currency } from './geo.models';
import { Phase, CatalogItem } from './catalog.models';

export type QuoteStatus = 'BORRADOR' | 'EN_REVISION' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA';

export interface QuoteAttributes {
  id: number;
  quoteNumber: string;
  version: number;
  parentQuoteId: number | null;
  clientId: number;
  countryId: number;
  currencyId: number;
  exchangeRateUsed: number;
  executiveId: number;
  title: string;
  description: string | null;
  sampleSize: number;
  marginPercent: number | null;
  status: QuoteStatus;
  validUntil: string | null;
}
export type QuoteCreation = Optional<
  QuoteAttributes,
  'id' | 'version' | 'parentQuoteId' | 'description' | 'marginPercent' | 'status' | 'validUntil'
>;
export class Quote extends Model<QuoteAttributes, QuoteCreation> implements QuoteAttributes {
  declare id: number;
  declare quoteNumber: string;
  declare version: number;
  declare parentQuoteId: number | null;
  declare clientId: number;
  declare countryId: number;
  declare currencyId: number;
  declare exchangeRateUsed: number;
  declare executiveId: number;
  declare title: string;
  declare description: string | null;
  declare sampleSize: number;
  declare marginPercent: number | null;
  declare status: QuoteStatus;
  declare validUntil: string | null;
}
Quote.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    quoteNumber: { type: DataTypes.STRING(30), allowNull: false, field: 'quote_number' },
    version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    parentQuoteId: { type: DataTypes.INTEGER, allowNull: true, field: 'parent_quote_id' },
    clientId: { type: DataTypes.INTEGER, allowNull: false, field: 'client_id' },
    countryId: { type: DataTypes.INTEGER, allowNull: false, field: 'country_id' },
    currencyId: { type: DataTypes.INTEGER, allowNull: false, field: 'currency_id' },
    exchangeRateUsed: { type: DataTypes.DECIMAL(18, 6), allowNull: false, field: 'exchange_rate_used' },
    executiveId: { type: DataTypes.INTEGER, allowNull: false, field: 'executive_id' },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    sampleSize: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0, field: 'sample_size' },
    marginPercent: { type: DataTypes.DECIMAL(6, 4), allowNull: true, field: 'margin_percent' },
    status: { type: DataTypes.ENUM('BORRADOR', 'EN_REVISION', 'APROBADA', 'RECHAZADA', 'CANCELADA'), allowNull: false, defaultValue: 'BORRADOR' },
    validUntil: { type: DataTypes.DATEONLY, allowNull: true, field: 'valid_until' },
  },
  { sequelize, tableName: 'quotes' }
);
Quote.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });
Quote.belongsTo(Country, { foreignKey: 'countryId', as: 'country' });
Quote.belongsTo(Currency, { foreignKey: 'currencyId', as: 'currency' });
Quote.belongsTo(User, { foreignKey: 'executiveId', as: 'executive' });
Quote.belongsTo(Quote, { foreignKey: 'parentQuoteId', as: 'parentQuote' });

export interface QuoteInputAttributes {
  id: number;
  quoteId: number;
  key: string;
  value: string;
}
export type QuoteInputCreation = Optional<QuoteInputAttributes, 'id'>;
export class QuoteInput extends Model<QuoteInputAttributes, QuoteInputCreation> implements QuoteInputAttributes {
  declare id: number;
  declare quoteId: number;
  declare key: string;
  declare value: string;
}
QuoteInput.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    quoteId: { type: DataTypes.INTEGER, allowNull: false, field: 'quote_id' },
    key: { type: DataTypes.STRING(100), allowNull: false, field: 'key' },
    value: { type: DataTypes.STRING(255), allowNull: false },
  },
  { sequelize, tableName: 'quote_inputs', timestamps: false }
);
QuoteInput.belongsTo(Quote, { foreignKey: 'quoteId', as: 'quote' });
Quote.hasMany(QuoteInput, { foreignKey: 'quoteId', as: 'inputs' });

export interface QuotePhaseAttributes {
  id: number;
  quoteId: number;
  phaseId: number;
  phaseNameSnapshot: string;
  sortOrder: number;
  subtotalUsd: number;
  subtotalLocal: number;
}
export type QuotePhaseCreation = Optional<QuotePhaseAttributes, 'id' | 'subtotalUsd' | 'subtotalLocal'>;
export class QuotePhase extends Model<QuotePhaseAttributes, QuotePhaseCreation> implements QuotePhaseAttributes {
  declare id: number;
  declare quoteId: number;
  declare phaseId: number;
  declare phaseNameSnapshot: string;
  declare sortOrder: number;
  declare subtotalUsd: number;
  declare subtotalLocal: number;
}
QuotePhase.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    quoteId: { type: DataTypes.INTEGER, allowNull: false, field: 'quote_id' },
    phaseId: { type: DataTypes.INTEGER, allowNull: false, field: 'phase_id' },
    phaseNameSnapshot: { type: DataTypes.STRING(100), allowNull: false, field: 'phase_name_snapshot' },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'sort_order' },
    subtotalUsd: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0, field: 'subtotal_usd' },
    subtotalLocal: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0, field: 'subtotal_local' },
  },
  { sequelize, tableName: 'quote_phases', timestamps: false }
);
QuotePhase.belongsTo(Quote, { foreignKey: 'quoteId', as: 'quote' });
QuotePhase.belongsTo(Phase, { foreignKey: 'phaseId', as: 'phase' });
Quote.hasMany(QuotePhase, { foreignKey: 'quoteId', as: 'phases' });

export interface QuoteItemAttributes {
  id: number;
  quotePhaseId: number;
  catalogItemId: number;
  itemNameSnapshot: string;
  categorySnapshot: string;
  quantity: number;
  days: number;
  unitPriceUsdSnapshot: number;
  totalUsd: number;
  totalLocal: number;
  internalCostUsdSnapshot: number;
  ruleSnapshotJson: Record<string, unknown> | null;
}
export type QuoteItemCreation = Optional<
  QuoteItemAttributes,
  'id' | 'quantity' | 'days' | 'unitPriceUsdSnapshot' | 'totalUsd' | 'totalLocal' | 'internalCostUsdSnapshot' | 'ruleSnapshotJson'
>;
export class QuoteItem extends Model<QuoteItemAttributes, QuoteItemCreation> implements QuoteItemAttributes {
  declare id: number;
  declare quotePhaseId: number;
  declare catalogItemId: number;
  declare itemNameSnapshot: string;
  declare categorySnapshot: string;
  declare quantity: number;
  declare days: number;
  declare unitPriceUsdSnapshot: number;
  declare totalUsd: number;
  declare totalLocal: number;
  declare internalCostUsdSnapshot: number;
  declare ruleSnapshotJson: Record<string, unknown> | null;
}
QuoteItem.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    quotePhaseId: { type: DataTypes.INTEGER, allowNull: false, field: 'quote_phase_id' },
    catalogItemId: { type: DataTypes.INTEGER, allowNull: false, field: 'catalog_item_id' },
    itemNameSnapshot: { type: DataTypes.STRING(150), allowNull: false, field: 'item_name_snapshot' },
    categorySnapshot: { type: DataTypes.STRING(100), allowNull: false, field: 'category_snapshot' },
    quantity: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
    days: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
    unitPriceUsdSnapshot: { type: DataTypes.DECIMAL(18, 4), allowNull: false, defaultValue: 0, field: 'unit_price_usd_snapshot' },
    totalUsd: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0, field: 'total_usd' },
    totalLocal: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0, field: 'total_local' },
    internalCostUsdSnapshot: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0, field: 'internal_cost_usd_snapshot' },
    ruleSnapshotJson: { type: DataTypes.JSON, allowNull: true, field: 'rule_snapshot_json' },
  },
  { sequelize, tableName: 'quote_items', timestamps: false }
);
QuoteItem.belongsTo(QuotePhase, { foreignKey: 'quotePhaseId', as: 'quotePhase' });
QuoteItem.belongsTo(CatalogItem, { foreignKey: 'catalogItemId', as: 'catalogItem' });
QuotePhase.hasMany(QuoteItem, { foreignKey: 'quotePhaseId', as: 'items' });

export interface QuoteSummaryLineAttributes {
  id: number;
  quoteId: number;
  label: string;
  valueUsd: number;
  valueLocal: number;
  kind: string;
  sortOrder: number;
}
export type QuoteSummaryLineCreation = Optional<QuoteSummaryLineAttributes, 'id' | 'sortOrder'>;
export class QuoteSummaryLine extends Model<QuoteSummaryLineAttributes, QuoteSummaryLineCreation> implements QuoteSummaryLineAttributes {
  declare id: number;
  declare quoteId: number;
  declare label: string;
  declare valueUsd: number;
  declare valueLocal: number;
  declare kind: string;
  declare sortOrder: number;
}
QuoteSummaryLine.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    quoteId: { type: DataTypes.INTEGER, allowNull: false, field: 'quote_id' },
    label: { type: DataTypes.STRING(150), allowNull: false },
    valueUsd: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0, field: 'value_usd' },
    valueLocal: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0, field: 'value_local' },
    kind: { type: DataTypes.STRING(60), allowNull: false },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'sort_order' },
  },
  { sequelize, tableName: 'quote_summary_lines', timestamps: false }
);
QuoteSummaryLine.belongsTo(Quote, { foreignKey: 'quoteId', as: 'quote' });
Quote.hasMany(QuoteSummaryLine, { foreignKey: 'quoteId', as: 'summaryLines' });

export interface QuoteCalculationLogAttributes {
  id: number;
  quoteId: number;
  executedAt: Date;
  inputSnapshotJson: Record<string, unknown>;
  outputSnapshotJson: Record<string, unknown>;
}
export type QuoteCalculationLogCreation = Optional<QuoteCalculationLogAttributes, 'id' | 'executedAt'>;
export class QuoteCalculationLog
  extends Model<QuoteCalculationLogAttributes, QuoteCalculationLogCreation>
  implements QuoteCalculationLogAttributes
{
  declare id: number;
  declare quoteId: number;
  declare executedAt: Date;
  declare inputSnapshotJson: Record<string, unknown>;
  declare outputSnapshotJson: Record<string, unknown>;
}
QuoteCalculationLog.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    quoteId: { type: DataTypes.INTEGER, allowNull: false, field: 'quote_id' },
    executedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'executed_at' },
    inputSnapshotJson: { type: DataTypes.JSON, allowNull: false, field: 'input_snapshot_json' },
    outputSnapshotJson: { type: DataTypes.JSON, allowNull: false, field: 'output_snapshot_json' },
  },
  { sequelize, tableName: 'quote_calculation_logs', timestamps: false }
);
QuoteCalculationLog.belongsTo(Quote, { foreignKey: 'quoteId', as: 'quote' });
Quote.hasMany(QuoteCalculationLog, { foreignKey: 'quoteId', as: 'calculationLogs' });
