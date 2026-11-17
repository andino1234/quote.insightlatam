import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Country } from './geo.models';
import { Role, User } from './security.models';

export interface PhaseAttributes {
  id: number;
  name: string;
  code: string;
  sortOrder: number;
  active: boolean;
}
export type PhaseCreation = Optional<PhaseAttributes, 'id' | 'sortOrder' | 'active'>;
export class Phase extends Model<PhaseAttributes, PhaseCreation> implements PhaseAttributes {
  declare id: number;
  declare name: string;
  declare code: string;
  declare sortOrder: number;
  declare active: boolean;
}
Phase.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'sort_order' },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, tableName: 'phases' }
);

export interface CostCategoryAttributes {
  id: number;
  name: string;
  code: string;
  active: boolean;
}
export type CostCategoryCreation = Optional<CostCategoryAttributes, 'id' | 'active'>;
export class CostCategory extends Model<CostCategoryAttributes, CostCategoryCreation> implements CostCategoryAttributes {
  declare id: number;
  declare name: string;
  declare code: string;
  declare active: boolean;
}
CostCategory.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, tableName: 'cost_categories' }
);

export interface CatalogItemAttributes {
  id: number;
  categoryId: number;
  name: string;
  code: string;
  unitLabel: string;
  active: boolean;
}
export type CatalogItemCreation = Optional<CatalogItemAttributes, 'id' | 'unitLabel' | 'active'>;
export class CatalogItem extends Model<CatalogItemAttributes, CatalogItemCreation> implements CatalogItemAttributes {
  declare id: number;
  declare categoryId: number;
  declare name: string;
  declare code: string;
  declare unitLabel: string;
  declare active: boolean;
}
CatalogItem.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    categoryId: { type: DataTypes.INTEGER, allowNull: false, field: 'category_id' },
    name: { type: DataTypes.STRING(150), allowNull: false },
    code: { type: DataTypes.STRING(60), allowNull: false, unique: true },
    unitLabel: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'unidad', field: 'unit_label' },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, tableName: 'catalog_items' }
);
CatalogItem.belongsTo(CostCategory, { foreignKey: 'categoryId', as: 'category' });
CostCategory.hasMany(CatalogItem, { foreignKey: 'categoryId', as: 'items' });

export interface PhaseItemAttributes {
  id: number;
  phaseId: number;
  catalogItemId: number;
  active: boolean;
}
export type PhaseItemCreation = Optional<PhaseItemAttributes, 'id' | 'active'>;
export class PhaseItem extends Model<PhaseItemAttributes, PhaseItemCreation> implements PhaseItemAttributes {
  declare id: number;
  declare phaseId: number;
  declare catalogItemId: number;
  declare active: boolean;
}
PhaseItem.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    phaseId: { type: DataTypes.INTEGER, allowNull: false, field: 'phase_id' },
    catalogItemId: { type: DataTypes.INTEGER, allowNull: false, field: 'catalog_item_id' },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, tableName: 'phase_items' }
);
PhaseItem.belongsTo(Phase, { foreignKey: 'phaseId', as: 'phase' });
PhaseItem.belongsTo(CatalogItem, { foreignKey: 'catalogItemId', as: 'catalogItem' });
Phase.hasMany(PhaseItem, { foreignKey: 'phaseId', as: 'phaseItems' });
CatalogItem.hasMany(PhaseItem, { foreignKey: 'catalogItemId', as: 'phaseItems' });

export interface CountryItemPriceAttributes {
  id: number;
  countryId: number;
  phaseItemId: number;
  unitPriceUsd: number;
  validFrom: string;
  validTo: string | null;
  active: boolean;
  createdBy: number | null;
}
export type CountryItemPriceCreation = Optional<CountryItemPriceAttributes, 'id' | 'validTo' | 'active' | 'createdBy'>;
export class CountryItemPrice extends Model<CountryItemPriceAttributes, CountryItemPriceCreation> implements CountryItemPriceAttributes {
  declare id: number;
  declare countryId: number;
  declare phaseItemId: number;
  declare unitPriceUsd: number;
  declare validFrom: string;
  declare validTo: string | null;
  declare active: boolean;
  declare createdBy: number | null;
}
CountryItemPrice.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    countryId: { type: DataTypes.INTEGER, allowNull: false, field: 'country_id' },
    phaseItemId: { type: DataTypes.INTEGER, allowNull: false, field: 'phase_item_id' },
    unitPriceUsd: { type: DataTypes.DECIMAL(18, 4), allowNull: false, field: 'unit_price_usd' },
    validFrom: { type: DataTypes.DATEONLY, allowNull: false, field: 'valid_from' },
    validTo: { type: DataTypes.DATEONLY, allowNull: true, field: 'valid_to' },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: true, field: 'created_by' },
  },
  { sequelize, tableName: 'country_item_prices' }
);
CountryItemPrice.belongsTo(Country, { foreignKey: 'countryId', as: 'country' });
CountryItemPrice.belongsTo(PhaseItem, { foreignKey: 'phaseItemId', as: 'phaseItem' });
CountryItemPrice.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
PhaseItem.hasMany(CountryItemPrice, { foreignKey: 'phaseItemId', as: 'prices' });

export type RuleType =
  | 'LINE_TOTAL'
  | 'CEIL_RATIO'
  | 'PERCENT_OF_DAYS'
  | 'UNIT_COST_DELTA'
  | 'REFERENCE_SALARY'
  | 'INTERNAL_COST_NORMALIZED'
  | 'SAMPLE_SIZING'
  | 'PROPORTIONAL_DATA_COST'
  | 'EXPECTED_MARGIN';

export interface CalculationRuleAttributes {
  id: number;
  code: string;
  name: string;
  ruleType: RuleType;
  paramsJson: Record<string, unknown>;
  phaseItemId: number | null;
  active: boolean;
}
export type CalculationRuleCreation = Optional<CalculationRuleAttributes, 'id' | 'phaseItemId' | 'active'>;
export class CalculationRule extends Model<CalculationRuleAttributes, CalculationRuleCreation> implements CalculationRuleAttributes {
  declare id: number;
  declare code: string;
  declare name: string;
  declare ruleType: RuleType;
  declare paramsJson: Record<string, unknown>;
  declare phaseItemId: number | null;
  declare active: boolean;
}
CalculationRule.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(60), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    ruleType: { type: DataTypes.STRING(60), allowNull: false, field: 'rule_type' },
    paramsJson: { type: DataTypes.JSON, allowNull: false, field: 'params_json' },
    phaseItemId: { type: DataTypes.INTEGER, allowNull: true, field: 'phase_item_id' },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, tableName: 'calculation_rules' }
);
CalculationRule.belongsTo(PhaseItem, { foreignKey: 'phaseItemId', as: 'phaseItem' });

export interface SizingParameterAttributes {
  id: number;
  quoteId: number | null;
  phaseCode: string;
  sampleSize: number;
  baseEffectiveness: number;
  attempts: number;
  minutesBetweenAttempts: number;
  surveyMinutes: number;
  workHoursDay: number;
  teamSize: number;
  errorMargin: number;
  daysPerWeek: number;
}
export type SizingParameterCreation = Optional<SizingParameterAttributes, 'id' | 'quoteId' | 'daysPerWeek'>;
export class SizingParameter extends Model<SizingParameterAttributes, SizingParameterCreation> implements SizingParameterAttributes {
  declare id: number;
  declare quoteId: number | null;
  declare phaseCode: string;
  declare sampleSize: number;
  declare baseEffectiveness: number;
  declare attempts: number;
  declare minutesBetweenAttempts: number;
  declare surveyMinutes: number;
  declare workHoursDay: number;
  declare teamSize: number;
  declare errorMargin: number;
  declare daysPerWeek: number;
}
SizingParameter.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    quoteId: { type: DataTypes.INTEGER, allowNull: true, field: 'quote_id' },
    phaseCode: { type: DataTypes.STRING(50), allowNull: false, field: 'phase_code' },
    sampleSize: { type: DataTypes.DECIMAL(18, 2), allowNull: false, field: 'sample_size' },
    baseEffectiveness: { type: DataTypes.DECIMAL(6, 4), allowNull: false, field: 'base_effectiveness' },
    attempts: { type: DataTypes.INTEGER, allowNull: false },
    minutesBetweenAttempts: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'minutes_between_attempts' },
    surveyMinutes: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'survey_minutes' },
    workHoursDay: { type: DataTypes.DECIMAL(6, 2), allowNull: false, field: 'work_hours_day' },
    teamSize: { type: DataTypes.INTEGER, allowNull: false, field: 'team_size' },
    errorMargin: { type: DataTypes.DECIMAL(6, 4), allowNull: false, field: 'error_margin' },
    daysPerWeek: { type: DataTypes.DECIMAL(4, 2), allowNull: false, defaultValue: 5, field: 'days_per_week' },
  },
  { sequelize, tableName: 'sizing_parameters' }
);

export type TeamType = 'LOCAL' | 'FOREIGN';

export interface WorkPlanAssignmentAttributes {
  id: number;
  countryId: number;
  phaseId: number;
  roleId: number;
  quantity: number;
  active: boolean;
}
export type WorkPlanAssignmentCreation = Optional<WorkPlanAssignmentAttributes, 'id' | 'active'>;
export class WorkPlanAssignment extends Model<WorkPlanAssignmentAttributes, WorkPlanAssignmentCreation> implements WorkPlanAssignmentAttributes {
  declare id: number;
  declare countryId: number;
  declare phaseId: number;
  declare roleId: number;
  declare quantity: number;
  declare active: boolean;
}
WorkPlanAssignment.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    countryId: { type: DataTypes.INTEGER, allowNull: false, field: 'country_id' },
    phaseId: { type: DataTypes.INTEGER, allowNull: false, field: 'phase_id' },
    roleId: { type: DataTypes.INTEGER, allowNull: false, field: 'role_id' },
    quantity: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, tableName: 'work_plan_assignments' }
);
WorkPlanAssignment.belongsTo(Country, { foreignKey: 'countryId', as: 'country' });
WorkPlanAssignment.belongsTo(Phase, { foreignKey: 'phaseId', as: 'phase' });
WorkPlanAssignment.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

export interface TeamConfigurationAttributes {
  id: number;
  countryId: number;
  phaseId: number;
  teamType: TeamType;
  active: boolean;
}
export type TeamConfigurationCreation = Optional<TeamConfigurationAttributes, 'id' | 'active'>;
export class TeamConfiguration extends Model<TeamConfigurationAttributes, TeamConfigurationCreation> implements TeamConfigurationAttributes {
  declare id: number;
  declare countryId: number;
  declare phaseId: number;
  declare teamType: TeamType;
  declare active: boolean;
}
TeamConfiguration.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    countryId: { type: DataTypes.INTEGER, allowNull: false, field: 'country_id' },
    phaseId: { type: DataTypes.INTEGER, allowNull: false, field: 'phase_id' },
    teamType: { type: DataTypes.STRING(20), allowNull: false, field: 'team_type' },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, tableName: 'team_configurations' }
);
TeamConfiguration.belongsTo(Country, { foreignKey: 'countryId', as: 'country' });
TeamConfiguration.belongsTo(Phase, { foreignKey: 'phaseId', as: 'phase' });

export interface TeamConfigurationItemAttributes {
  id: number;
  teamConfigurationId: number;
  roleId: number;
  quantity: number;
  active: boolean;
}
export type TeamConfigurationItemCreation = Optional<TeamConfigurationItemAttributes, 'id' | 'active'>;
export class TeamConfigurationItem extends Model<TeamConfigurationItemAttributes, TeamConfigurationItemCreation> implements TeamConfigurationItemAttributes {
  declare id: number;
  declare teamConfigurationId: number;
  declare roleId: number;
  declare quantity: number;
  declare active: boolean;
}
TeamConfigurationItem.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    teamConfigurationId: { type: DataTypes.INTEGER, allowNull: false, field: 'team_configuration_id' },
    roleId: { type: DataTypes.INTEGER, allowNull: false, field: 'role_id' },
    quantity: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, tableName: 'team_configuration_items' }
);
TeamConfigurationItem.belongsTo(TeamConfiguration, { foreignKey: 'teamConfigurationId', as: 'teamConfiguration' });
TeamConfigurationItem.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
TeamConfiguration.hasMany(TeamConfigurationItem, { foreignKey: 'teamConfigurationId', as: 'items' });
