import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './security.models';

export interface CurrencyAttributes {
  id: number;
  code: string;
  name: string;
  symbol: string;
}
export type CurrencyCreation = Optional<CurrencyAttributes, 'id'>;
export class Currency extends Model<CurrencyAttributes, CurrencyCreation> implements CurrencyAttributes {
  declare id: number;
  declare code: string;
  declare name: string;
  declare symbol: string;
}
Currency.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(10), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(60), allowNull: false },
    symbol: { type: DataTypes.STRING(10), allowNull: false },
  },
  { sequelize, tableName: 'currencies', timestamps: false }
);

export interface CountryAttributes {
  id: number;
  name: string;
  iso2: string;
  iso3: string;
  currencyId: number;
  isDefault: boolean;
  active: boolean;
}
export type CountryCreation = Optional<CountryAttributes, 'id' | 'isDefault' | 'active'>;
export class Country extends Model<CountryAttributes, CountryCreation> implements CountryAttributes {
  declare id: number;
  declare name: string;
  declare iso2: string;
  declare iso3: string;
  declare currencyId: number;
  declare isDefault: boolean;
  declare active: boolean;
}
Country.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    iso2: { type: DataTypes.STRING(2), allowNull: false, unique: true },
    iso3: { type: DataTypes.STRING(3), allowNull: false, unique: true },
    currencyId: { type: DataTypes.INTEGER, allowNull: false, field: 'currency_id' },
    isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_default' },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, tableName: 'countries' }
);
Country.belongsTo(Currency, { foreignKey: 'currencyId', as: 'currency' });

export interface CountryCalculationSettingAttributes {
  id: number;
  countryId: number;
  paymentIncreaseRatio: number | null;
  reducedDayDiscountRatio: number | null;
  exchangeRate: number | null;
  referenceDailySalaryLocal: number | null;
  referenceDailySalaryUsd: number | null;
  currencyCode: string | null;
  isConfigured: boolean;
  active: boolean;
}
export type CountryCalculationSettingCreation = Optional<CountryCalculationSettingAttributes, 'id' | 'isConfigured' | 'active'>;
export class CountryCalculationSetting extends Model<CountryCalculationSettingAttributes, CountryCalculationSettingCreation> implements CountryCalculationSettingAttributes {
  declare id: number;
  declare countryId: number;
  declare paymentIncreaseRatio: number | null;
  declare reducedDayDiscountRatio: number | null;
  declare exchangeRate: number | null;
  declare referenceDailySalaryLocal: number | null;
  declare referenceDailySalaryUsd: number | null;
  declare currencyCode: string | null;
  declare isConfigured: boolean;
  declare active: boolean;
}
CountryCalculationSetting.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    countryId: { type: DataTypes.INTEGER, allowNull: false, field: 'country_id' },
    paymentIncreaseRatio: { type: DataTypes.DECIMAL(18, 6), allowNull: true, field: 'payment_increase_ratio' },
    reducedDayDiscountRatio: { type: DataTypes.DECIMAL(18, 6), allowNull: true, field: 'reduced_day_discount_ratio' },
    exchangeRate: { type: DataTypes.DECIMAL(18, 6), allowNull: true, field: 'exchange_rate' },
    referenceDailySalaryLocal: { type: DataTypes.DECIMAL(18, 2), allowNull: true, field: 'reference_daily_salary_local' },
    referenceDailySalaryUsd: { type: DataTypes.DECIMAL(18, 2), allowNull: true, field: 'reference_daily_salary_usd' },
    currencyCode: { type: DataTypes.STRING(10), allowNull: true, field: 'currency_code' },
    isConfigured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_configured' },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, tableName: 'country_calculation_settings' }
);
CountryCalculationSetting.belongsTo(Country, { foreignKey: 'countryId', as: 'country' });
Country.hasOne(CountryCalculationSetting, { foreignKey: 'countryId', as: 'calculationSettings' });

export interface CountryIncentiveAttributes {
  id: number;
  countryId: number;
  type: 'PILOTO' | 'EVALUACION';
  unitValueUsd: number;
  currencyCode: string;
  active: boolean;
}
export type CountryIncentiveCreation = Optional<CountryIncentiveAttributes, 'id' | 'active'>;
export class CountryIncentive extends Model<CountryIncentiveAttributes, CountryIncentiveCreation> implements CountryIncentiveAttributes {
  declare id: number;
  declare countryId: number;
  declare type: 'PILOTO' | 'EVALUACION';
  declare unitValueUsd: number;
  declare currencyCode: string;
  declare active: boolean;
}
CountryIncentive.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    countryId: { type: DataTypes.INTEGER, allowNull: false, field: 'country_id' },
    type: { type: DataTypes.STRING(20), allowNull: false },
    unitValueUsd: { type: DataTypes.DECIMAL(18, 4), allowNull: false, field: 'unit_value_usd' },
    currencyCode: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'USD', field: 'currency_code' },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, tableName: 'country_incentives' }
);
CountryIncentive.belongsTo(Country, { foreignKey: 'countryId', as: 'country' });
Country.hasMany(CountryIncentive, { foreignKey: 'countryId', as: 'incentives' });

export interface ExchangeRateAttributes {
  id: number;
  countryId: number;
  baseCurrencyId: number;
  targetCurrencyId: number;
  rate: number;
  validFrom: string;
  validTo: string | null;
  active: boolean;
  createdBy: number | null;
}
export type ExchangeRateCreation = Optional<ExchangeRateAttributes, 'id' | 'validTo' | 'active' | 'createdBy'>;
export class ExchangeRate extends Model<ExchangeRateAttributes, ExchangeRateCreation> implements ExchangeRateAttributes {
  declare id: number;
  declare countryId: number;
  declare baseCurrencyId: number;
  declare targetCurrencyId: number;
  declare rate: number;
  declare validFrom: string;
  declare validTo: string | null;
  declare active: boolean;
  declare createdBy: number | null;
}
ExchangeRate.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    countryId: { type: DataTypes.INTEGER, allowNull: false, field: 'country_id' },
    baseCurrencyId: { type: DataTypes.INTEGER, allowNull: false, field: 'base_currency_id' },
    targetCurrencyId: { type: DataTypes.INTEGER, allowNull: false, field: 'target_currency_id' },
    rate: { type: DataTypes.DECIMAL(18, 6), allowNull: false },
    validFrom: { type: DataTypes.DATEONLY, allowNull: false, field: 'valid_from' },
    validTo: { type: DataTypes.DATEONLY, allowNull: true, field: 'valid_to' },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: true, field: 'created_by' },
  },
  { sequelize, tableName: 'exchange_rates' }
);
ExchangeRate.belongsTo(Country, { foreignKey: 'countryId', as: 'country' });
ExchangeRate.belongsTo(Currency, { foreignKey: 'baseCurrencyId', as: 'baseCurrency' });
ExchangeRate.belongsTo(Currency, { foreignKey: 'targetCurrencyId', as: 'targetCurrency' });
ExchangeRate.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

export interface ClientAttributes {
  id: number;
  countryId: number;
  name: string;
  legalName: string | null;
  taxId: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  active: boolean;
}
export type ClientCreation = Optional<ClientAttributes, 'id' | 'active' | 'legalName' | 'taxId' | 'contactName' | 'email' | 'phone' | 'address'>;
export class Client extends Model<ClientAttributes, ClientCreation> implements ClientAttributes {
  declare id: number;
  declare countryId: number;
  declare name: string;
  declare legalName: string | null;
  declare taxId: string | null;
  declare contactName: string | null;
  declare email: string | null;
  declare phone: string | null;
  declare address: string | null;
  declare active: boolean;
}
Client.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    countryId: { type: DataTypes.INTEGER, allowNull: false, field: 'country_id' },
    name: { type: DataTypes.STRING(150), allowNull: false },
    legalName: { type: DataTypes.STRING(200), allowNull: true, field: 'legal_name' },
    taxId: { type: DataTypes.STRING(50), allowNull: true, field: 'tax_id' },
    contactName: { type: DataTypes.STRING(150), allowNull: true, field: 'contact_name' },
    email: { type: DataTypes.STRING(150), allowNull: true },
    phone: { type: DataTypes.STRING(50), allowNull: true },
    address: { type: DataTypes.STRING(255), allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, tableName: 'clients' }
);
Client.belongsTo(Country, { foreignKey: 'countryId', as: 'country' });
