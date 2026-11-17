export type RoleName = 'ADMINISTRADOR' | 'GERENCIA' | 'EJECUTIVO' | 'OPERACIONES' | (string & {});

export interface RolePermission {
  id?: number;
  module: string;
  view: boolean;
}

export type ModuleKey =
  | 'Dashboard'
  | 'Cotizaciones'
  | 'Mantenimientos'
  | 'Rúbricas'
  | 'Reportes'
  | 'Usuarios';

export interface RoleOption {
  id: number;
  name: RoleName;
  permissions?: RolePermission[];
}

export interface UserListItem {
  id: number;
  name: string;
  email: string;
  active: boolean;
  role?: {
    id: number;
    name: RoleName;
  } | null;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: RoleName;
    permissions?: RolePermission[];
  };
}

export interface QuoteListItem {
  id: number;
  quoteNumber: string;
  title: string;
  status: string;
  sampleSize?: number | null;
  marginPercent?: number | null;
  client?: {
    id: number;
    name: string;
  } | null;
  country?: {
    id: number;
    name: string;
  } | null;
  validUntil?: string | null;
}

export interface QuoteDetailItem {
  id: number;
  catalogItemId: number;
  itemNameSnapshot: string;
  categorySnapshot: string;
  quantity: number;
  days: number;
  unitPriceUsdSnapshot: number;
  totalUsd: number;
  totalLocal: number;
  internalCostUsdSnapshot: number;
}

export interface QuoteDetailPhase {
  id: number;
  phaseId: number;
  phaseNameSnapshot: string;
  sortOrder: number;
  subtotalUsd: number;
  subtotalLocal: number;
  items: QuoteDetailItem[];
}

export interface QuoteDetail {
  id: number;
  quoteNumber: string;
  title: string;
  description: string | null;
  status: string;
  sampleSize?: number | null;
  validUntil?: string | null;
  client?: {
    id: number;
    name: string;
  } | null;
  country?: {
    id: number;
    name: string;
  } | null;
  phases?: QuoteDetailPhase[];
  summaryLines?: Array<{
    id: number;
    label: string;
    valueUsd: number;
    valueLocal: number;
    kind: string;
  }>;
}

export interface ClientOption {
  id: number;
  name: string;
  countryId?: number;
}

export interface CountryOption {
  id: number;
  name: string;
  iso3?: string;
  currencyId?: number;
  calculationSettings?: CountryCalculationSettingOption[];
}

export interface CountryCalculationSettingOption {
  id: number;
  countryId: number;
  paymentIncreaseRatio?: number | null;
  reducedDayDiscountRatio?: number | null;
  exchangeRate?: number | null;
  referenceDailySalaryLocal?: number | null;
  referenceDailySalaryUsd?: number | null;
  currencyCode?: string | null;
  isConfigured?: boolean;
  active?: boolean;
}

export interface CountryIncentiveOption {
  id: number;
  countryId: number;
  type: 'PILOTO' | 'EVALUACION';
  unitValueUsd: number;
  currencyCode?: string;
  active?: boolean;
}

export interface WorkPlanAssignmentOption {
  id: number;
  countryId: number;
  phaseId: number;
  roleId: number;
  quantity: number;
  active?: boolean;
}

export interface TeamConfigurationOption {
  id: number;
  countryId: number;
  phaseId: number;
  teamType: 'LOCAL' | 'FOREIGN';
  active?: boolean;
}

export interface TeamConfigurationItemOption {
  id: number;
  teamConfigurationId: number;
  roleId: number;
  quantity: number;
  active?: boolean;
}

export interface PhaseOption {
  id: number;
  name: string;
  code: string;
  sortOrder?: number;
}

export interface CatalogItemOption {
  id: number;
  name: string;
  code: string;
  categoryId?: number;
  unitLabel?: string;
}

export interface PhaseItemOption {
  id: number;
  phaseId: number;
  catalogItemId: number;
  active?: boolean;
}

export interface CountryItemPriceOption {
  id: number;
  countryId: number;
  phaseItemId: number;
  unitPriceUsd: number | string;
  active?: boolean;
}

export interface ExchangeRateOption {
  id: number;
  countryId: number;
  rate: number | string;
  active?: boolean;
}

export interface CurrencyOption {
  id: number;
  code: string;
  name: string;
  symbol: string;
}

export interface CostCategoryOption {
  id: number;
  name: string;
  code: string;
  active?: boolean;
}

export interface CalculationRuleOption {
  id: number;
  code: string;
  name: string;
  ruleType: string;
  paramsJson?: Record<string, unknown> | null;
  phaseItemId?: number | null;
  active?: boolean;
}

export interface QuoteCreatePayload {
  clientId: number;
  countryId: number;
  title: string;
  description?: string;
  sampleSize: number;
  validUntil?: string;
  phases: {
    phaseId: number;
    items: Array<{ catalogItemId: number; quantity?: number; days?: number }>;
  }[];
}

export interface QuoteSummaryItem {
  id: number;
  title: string;
  status: string;
  totalUsd?: number;
}
