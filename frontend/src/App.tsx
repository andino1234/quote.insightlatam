import { Fragment, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import './App.css';
import { apiRequest } from './lib/api';
import type {
  CalculationRuleOption,
  CatalogItemOption,
  ClientOption,
  CostCategoryOption,
  CountryCalculationSettingOption,
  CountryIncentiveOption,
  CountryItemPriceOption,
  CountryOption,
  CurrencyOption,
  ExchangeRateOption,
  LoginResponse,
  PhaseItemOption,
  PhaseOption,
  QuoteCreatePayload,
  QuoteDetail,
  QuoteListItem,
  RoleName,
  TeamConfigurationOption,
  WorkPlanAssignmentOption,
  RoleOption,
  UserListItem,
  RolePermission,
  ModuleKey,
} from './types';

const STORAGE_KEY = 'costosapp-session-v1';
const modules: ModuleKey[] = ['Dashboard', 'Cotizaciones', 'Mantenimientos', 'Rúbricas', 'Reportes', 'Usuarios'];
const statusOptions = ['BORRADOR', 'EN_REVISION', 'APROBADA', 'RECHAZADA', 'CANCELADA'];
const roleModules: Record<RoleName, string[]> = {
  ADMINISTRADOR: modules,
  GERENCIA: ['Dashboard', 'Cotizaciones', 'Mantenimientos', 'Rúbricas', 'Reportes'],
  EJECUTIVO: ['Dashboard', 'Cotizaciones', 'Rúbricas', 'Reportes'],
  OPERACIONES: ['Dashboard', 'Cotizaciones', 'Rúbricas', 'Reportes'],
};
const normalizeRoleLabel = (role: RoleName | undefined) => {
  if (!role) return 'ADMINISTRADOR';
  return role;
};
const getPermissionStateFromRole = (rolePermissions?: RolePermission[]) => {
  const state = Object.fromEntries(modules.map((module) => [module, false])) as Record<ModuleKey, boolean>;
  if (!rolePermissions) return state;
  for (const permission of rolePermissions) {
    if (modules.includes(permission.module as ModuleKey)) {
      state[permission.module as ModuleKey] = Boolean(permission.view);
    }
  }
  return state;
};
const getVisibleModulesByRole = (roleName: RoleName | undefined, rolePermissions?: RolePermission[]) => {
  const normalizedRole = normalizeRoleLabel(roleName);
  const permissionState = getPermissionStateFromRole(rolePermissions);
  const explicitModules = modules.filter((module) => permissionState[module]);
  if (explicitModules.length > 0) return explicitModules;
  return roleModules[normalizedRole as RoleName] ?? modules;
};

const initialForm = {
  clientId: '',
  countryId: '',
  title: '',
  description: '',
  sampleSize: '1',
  validUntil: '',
};

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedModule, setSelectedModule] = useState('Dashboard');
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteForm, setQuoteForm] = useState(initialForm);
  const [creatingQuote, setCreatingQuote] = useState(false);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [costCategories, setCostCategories] = useState<CostCategoryOption[]>([]);
  const [phases, setPhases] = useState<PhaseOption[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItemOption[]>([]);
  const [phaseItems, setPhaseItems] = useState<PhaseItemOption[]>([]);
  const [countryPrices, setCountryPrices] = useState<CountryItemPriceOption[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRateOption[]>([]);
  const [calculationRules, setCalculationRules] = useState<CalculationRuleOption[]>([]);
  const [countryCalculationSettings, setCountryCalculationSettings] = useState<CountryCalculationSettingOption[]>([]);
  const [countryIncentives, setCountryIncentives] = useState<CountryIncentiveOption[]>([]);
  const [workPlanAssignments, setWorkPlanAssignments] = useState<WorkPlanAssignmentOption[]>([]);
  const [teamConfigurations, setTeamConfigurations] = useState<TeamConfigurationOption[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [roleDraftName, setRoleDraftName] = useState('');
  const [rolePermissionDrafts, setRolePermissionDrafts] = useState<Record<number, Record<ModuleKey, boolean>>>({});
  const [newRolePermissions, setNewRolePermissions] = useState<Record<ModuleKey, boolean>>({
    Dashboard: true,
    Cotizaciones: true,
    Mantenimientos: true,
    Rúbricas: true,
    Reportes: true,
    Usuarios: true,
  });
  const [userDraft, setUserDraft] = useState({ name: '', email: '', password: '', roleId: '' });
  const [selectedPhaseIds, setSelectedPhaseIds] = useState<number[]>([]);
  const [maintenanceSection, setMaintenanceSection] = useState<'roles' | 'cotizaciones' | 'paises' | 'parametros' | 'incentivos' | 'planTrabajo' | 'equipos' | 'clientes' | 'fases' | 'conceptos' | 'precios' | 'tiposCambio' | 'reglas'>('roles');
  const [selectedMaintenanceCountryId, setSelectedMaintenanceCountryId] = useState<string>('');
  const [priceDrafts, setPriceDrafts] = useState<Record<number, number>>({});
  const [quotePhaseDrafts, setQuotePhaseDrafts] = useState<Record<number, Array<{ catalogItemId: number; quantity: number; days: number }>>>({});
  const [selectedQuote, setSelectedQuote] = useState<QuoteListItem | null>(null);
  const [quoteDetail, setQuoteDetail] = useState<QuoteDetail | null>(null);
  const [selectedRubricQuoteId, setSelectedRubricQuoteId] = useState<number | null>(null);
  const [rubricQuoteDetail, setRubricQuoteDetail] = useState<QuoteDetail | null>(null);
  const [quoteEditor, setQuoteEditor] = useState<{ title: string; description: string; status: string; clientId: string; countryId: string; sampleSize: string; validUntil: string } | null>(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientDraft, setNewClientDraft] = useState({
    countryId: '',
    name: '',
    legalName: '',
    taxId: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
  });
  const [clientDraft, setClientDraft] = useState({
    countryId: '',
    name: '',
    legalName: '',
    taxId: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
  });
  const [countryDraft, setCountryDraft] = useState({ name: '', iso2: '', iso3: '', currencyId: '', isDefault: false });
  const [countrySettingDraft, setCountrySettingDraft] = useState({
    paymentIncreaseRatio: '',
    reducedDayDiscountRatio: '',
    exchangeRate: '',
    referenceDailySalaryLocal: '',
    referenceDailySalaryUsd: '',
    currencyCode: '',
  });
  const [countryIncentiveDraft, setCountryIncentiveDraft] = useState({
    countryId: '',
    type: 'PILOTO',
    unitValueUsd: '',
    currencyCode: 'USD',
  });
  const [workPlanDraft, setWorkPlanDraft] = useState({
    countryId: '',
    phaseId: '',
    roleId: '',
    quantity: '1',
  });
  const [teamConfigurationDraft, setTeamConfigurationDraft] = useState({
    countryId: '',
    phaseId: '',
    teamType: 'LOCAL',
  });

  const normalizeRatioPercent = (value: number) => {
    const numeric = Number.isFinite(value) ? value : 0;
    if (numeric === 0) return 0;
    return Math.abs(numeric) > 1 ? numeric / 100 : numeric;
  };

  const salaryPreview = useMemo(() => {
    const incrementPercent = normalizeRatioPercent(Number(countrySettingDraft.paymentIncreaseRatio || 0));
    const reductionPercent = normalizeRatioPercent(Number(countrySettingDraft.reducedDayDiscountRatio || 0));
    const exchangeRate = Number(countrySettingDraft.exchangeRate || 0);
    const workingDaysPerMonth = 26.8;
    const referenceSalaryPerDay = exchangeRate > 0 ? (690 * (1 + incrementPercent) * exchangeRate) / workingDaysPerMonth : 0;
    const reducedSalaryPerDay = exchangeRate > 0 ? (690 * (1 + incrementPercent - reductionPercent) * exchangeRate) / workingDaysPerMonth : 0;

    return { referenceSalaryPerDay, reducedSalaryPerDay };
  }, [countrySettingDraft]);
  const [phaseDraft, setPhaseDraft] = useState({ name: '', code: '', sortOrder: '0' });
  const [catalogDraft, setCatalogDraft] = useState({ categoryId: '', code: '', name: '', unitLabel: 'unidad' });
  const [ruleDraft, setRuleDraft] = useState({ code: '', name: '', ruleType: 'LINE_TOTAL', paramsJson: '{"multiplier":1}', phaseItemId: '' });
  const [session, setSession] = useState<LoginResponse | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    try {
      return JSON.parse(stored) as LoginResponse;
    } catch {
      return null;
    }
  });
  const [quotes, setQuotes] = useState<QuoteListItem[]>([]);

  const sessionRoleName = session?.user.role as RoleName | undefined;
  const roleLabel = normalizeRoleLabel(sessionRoleName);
  const visibleModules = session && sessionRoleName ? getVisibleModulesByRole(sessionRoleName, session.user.permissions) : modules;
  const canAccessModule = (module: ModuleKey) => visibleModules.includes(module);

  useEffect(() => {
    if (!session) return;
    if (!visibleModules.includes(selectedModule)) {
      setSelectedModule(visibleModules[0] ?? 'Dashboard');
    }
  }, [session, selectedModule, visibleModules]);

  useEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);

  useEffect(() => {
    if (!session) {
      setQuotes([]);
      return;
    }

    const loadQuotes = async () => {
      setQuotesLoading(true);
      setError('');

      try {
        const payload = await apiRequest<QuoteListItem[]>('/quotes', { method: 'GET' }, session.token);
        setQuotes(payload);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo cargar el dashboard';
        setError(message);
      } finally {
        setQuotesLoading(false);
      }
    };

    const loadCatalogs = async () => {
      try {
        const isAdmin = normalizeRoleLabel(session.user.role as RoleName | undefined) === 'ADMINISTRADOR';

        const [
          countriesData,
          clientsData,
          phasesData,
          catalogData,
          phaseItemData,
          pricesData,
          exchangeRatesData,
          currenciesData,
          costCategoriesData,
          rulesData,
          countrySettingsData,
          countryIncentivesData,
          workPlanAssignmentsData,
          teamConfigurationsData,
        ] = await Promise.all([
          apiRequest<CountryOption[]>('/countries', { method: 'GET' }, session.token),
          apiRequest<ClientOption[]>('/clients', { method: 'GET' }, session.token),
          apiRequest<PhaseOption[]>('/phases', { method: 'GET' }, session.token),
          apiRequest<CatalogItemOption[]>('/catalog-items', { method: 'GET' }, session.token),
          apiRequest<PhaseItemOption[]>('/phase-items', { method: 'GET' }, session.token),
          apiRequest<CountryItemPriceOption[]>('/prices', { method: 'GET' }, session.token),
          apiRequest<ExchangeRateOption[]>('/exchange-rates', { method: 'GET' }, session.token),
          apiRequest<CurrencyOption[]>('/currencies', { method: 'GET' }, session.token),
          apiRequest<CostCategoryOption[]>('/cost-categories', { method: 'GET' }, session.token),
          apiRequest<CalculationRuleOption[]>('/calculation-rules', { method: 'GET' }, session.token),
          apiRequest<CountryCalculationSettingOption[]>('/country-calculation-settings', { method: 'GET' }, session.token),
          apiRequest<CountryIncentiveOption[]>('/country-incentives', { method: 'GET' }, session.token),
          apiRequest<WorkPlanAssignmentOption[]>('/work-plan-assignments', { method: 'GET' }, session.token),
          apiRequest<TeamConfigurationOption[]>('/team-configurations', { method: 'GET' }, session.token),
        ]);

        let rolesData: RoleOption[] = [];
        let usersData: UserListItem[] = [];

        if (isAdmin) {
          [rolesData, usersData] = await Promise.all([
            apiRequest<RoleOption[]>('/roles', { method: 'GET' }, session.token),
            apiRequest<UserListItem[]>('/users', { method: 'GET' }, session.token),
          ]);
        }

        setCountries(countriesData);
        setClients(clientsData);
        setPhases(phasesData);
        setCatalogItems(catalogData);
        setPhaseItems(phaseItemData);
        setCountryPrices(pricesData);
        setExchangeRates(exchangeRatesData);
        setCurrencies(currenciesData);
        setCostCategories(costCategoriesData);
        setCalculationRules(rulesData);
        setCountryCalculationSettings(countrySettingsData);
        setCountryIncentives(countryIncentivesData);
        setWorkPlanAssignments(workPlanAssignmentsData);
        setTeamConfigurations(teamConfigurationsData);
        setRoles(rolesData);
        setUsers(usersData);
        setSelectedPhaseIds([]);

        if (!selectedMaintenanceCountryId && countriesData.length > 0) {
          setSelectedMaintenanceCountryId(String(countriesData[0].id));
        }

        const initialDrafts: Record<number, Array<{ catalogItemId: number; quantity: number; days: number }>> = {};
        for (const phase of phasesData) {
          const matchingPhaseItems = phaseItemData.filter((entry) => entry.phaseId === phase.id);
          if (matchingPhaseItems.length === 0) continue;
          initialDrafts[phase.id] = matchingPhaseItems.map((entry) => ({
            catalogItemId: entry.catalogItemId,
            quantity: 1,
            days: 1,
          }));
        }
        setQuotePhaseDrafts(initialDrafts);
      } catch {
        setCountries([]);
        setClients([]);
        setPhases([]);
        setCatalogItems([]);
        setPhaseItems([]);
        setCountryPrices([]);
        setExchangeRates([]);
        setCurrencies([]);
        setCostCategories([]);
        setCalculationRules([]);
        setRoles([]);
        setUsers([]);
        setSelectedPhaseIds([]);
        setQuotePhaseDrafts({});
      }
    };

    void loadQuotes();
    void loadCatalogs();
  }, [session]);

  const stats = useMemo(
    () => [
      { label: 'Cotizaciones', value: String(quotes.length || 0), delta: quotes.length ? `${quotes.filter((q) => q.status === 'APROBADA').length} aprobadas` : 'sin datos' },
      { label: 'Borradores', value: String(quotes.filter((q) => q.status === 'BORRADOR').length), delta: 'pendientes' },
      { label: 'En revisión', value: String(quotes.filter((q) => q.status === 'EN_REVISION').length), delta: 'por validar' },
      { label: 'Margen medio', value: quotes.length ? `${Math.max(...quotes.map((q) => Number(q.marginPercent ?? 0))).toFixed(1)}%` : '0.0%', delta: 'promedio' },
    ],
    [quotes]
  );

  const quoteRows = useMemo(
    () =>
      quotes.slice(0, 4).map((quote) => ({
        name: quote.title,
        client: quote.client?.name ?? 'Sin cliente',
        country: quote.country?.name ?? 'Sin país',
        amount: quote.marginPercent !== null && quote.marginPercent !== undefined ? `${Number(quote.marginPercent).toFixed(1)}%` : '—',
        status: quote.status,
      })),
    [quotes]
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setSession(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo iniciar sesión';
      setError(message);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setSession(null);
    setQuotes([]);
    setClients([]);
    setCountries([]);
    setPhases([]);
  };

  const formatStatusClass = (status: string) => status.toLowerCase().replace(/_/g, '-');

  const sanitizeText = (value?: string) => {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  };

  const cleanPayload = <T extends Record<string, unknown>>(payload: T) =>
    Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== '')
    ) as T;

  const getCountryCodeById = (countryId?: string | number) => {
    if (!countryId) return 'USD';
    const matchedCountry = countries.find((country) => Number(country.id) === Number(countryId));
    return matchedCountry?.iso3 ?? 'USD';
  };

  const formatCurrency = (value: number, countryId?: string | number) => {
    const selectedCountryId = countryId ?? quoteForm.countryId ?? selectedMaintenanceCountryId ?? undefined;
    const countryCode = getCountryCodeById(selectedCountryId);
    return `$${Number(value || 0).toFixed(2)} (${countryCode})`;
  };

  const formatMoney = (value: number, countryId?: string | number) => {
    const selectedCountryId = countryId ?? rubricQuoteDetail?.country?.id ?? quoteForm.countryId ?? selectedMaintenanceCountryId ?? undefined;
    const countryCode = getCountryCodeById(selectedCountryId);
    return `$${Number(value || 0).toFixed(2)} (${countryCode})`;
  };

  const triggerSaveFeedback = (message: string, button?: HTMLButtonElement | null) => {
    setError('');
    setSuccessMessage(message);
    if (button) {
      button.classList.remove('save-success');
      void button.offsetWidth;
      button.classList.add('save-success');
      window.setTimeout(() => button.classList.remove('save-success'), 1600);
    }
    window.setTimeout(() => setSuccessMessage(''), 2600);
  };

  const getCatalogCategoryLabel = (catalogItem?: CatalogItemOption) => {
    if (!catalogItem) return 'General';

    const mergedText = `${catalogItem.code} ${catalogItem.name}`.toLowerCase();
    if (mergedText.includes('viatic') || mergedText.includes('hotel') || mergedText.includes('alimentacion') || mergedText.includes('transporte')) {
      return 'Viáticos';
    }
    if (mergedText.includes('supervisor') || mergedText.includes('encuestador') || mergedText.includes('coordinador') || mergedText.includes('auditor') || mergedText.includes('director') || mergedText.includes('personal')) {
      return 'Personal';
    }
    if (mergedText.includes('incentiv')) {
      return 'Incentivos';
    }
    if (mergedText.includes('datos') || mergedText.includes('conex') || mergedText.includes('salas') || mergedText.includes('seguro') || mergedText.includes('tablet') || mergedText.includes('grabador') || mergedText.includes('bater') || mergedText.includes('chaleco') || mergedText.includes('administr')) {
      return 'Materiales y servicios';
    }
    return 'General';
  };

  const maintenanceRows = useMemo(() => {
    if (!selectedMaintenanceCountryId) return [];

    const selectedCountryId = Number(selectedMaintenanceCountryId);
    return phases.flatMap((phase) =>
      phaseItems
        .filter((entry) => entry.phaseId === phase.id)
        .map((entry) => {
          const catalogItem = catalogItems.find((item) => item.id === entry.catalogItemId);
          if (!catalogItem) return null;

          const priceRecord = countryPrices.find(
            (price) => Number(price.countryId) === selectedCountryId && Number(price.phaseItemId) === Number(entry.id) && price.active !== false
          );

          return {
            phaseItemId: entry.id,
            priceId: priceRecord?.id,
            phaseName: phase.name,
            catalogName: catalogItem.name,
            unitPriceUsd: Number(priceRecord?.unitPriceUsd ?? 0),
          };
        })
        .filter(Boolean) as Array<{ phaseItemId: number; priceId?: number; phaseName: string; catalogName: string; unitPriceUsd: number }>
    );
  }, [catalogItems, countryPrices, phaseItems, phases, selectedMaintenanceCountryId]);

  const getSelectedExchangeRate = () => {
    const selectedCountryId = Number(quoteForm.countryId || 0);
    if (!selectedCountryId) return 1;
    const activeRate = exchangeRates.find((rate) => Number(rate.countryId) === selectedCountryId && rate.active !== false);
    return Number(activeRate?.rate ?? 1);
  };

  const getUnitPriceForPhaseRow = (phaseId: number, catalogItemId: number) => {
    const selectedCountryId = Number(quoteForm.countryId || 0);
    if (!selectedCountryId) return 0;

    const phaseItem = phaseItems.find((entry) => entry.phaseId === phaseId && entry.catalogItemId === catalogItemId);
    if (!phaseItem) return 0;

    const priceRecord = countryPrices.find(
      (price) => Number(price.countryId) === selectedCountryId && Number(price.phaseItemId) === Number(phaseItem.id) && price.active !== false
    );

    return Number(priceRecord?.unitPriceUsd ?? 0);
  };

  const handleSavePrice = async (row: { phaseItemId: number; priceId?: number; phaseName: string; catalogName: string; unitPriceUsd: number }, button?: HTMLButtonElement | null) => {
    if (!session) return;
    const selectedCountryId = Number(selectedMaintenanceCountryId || 0);
    const nextValue = Number(priceDrafts[row.phaseItemId] ?? row.unitPriceUsd);

    try {
      if (row.priceId) {
        await apiRequest(
          `/prices/${row.priceId}`,
          {
            method: 'PUT',
            body: JSON.stringify({
              countryId: selectedCountryId,
              phaseItemId: row.phaseItemId,
              unitPriceUsd: nextValue,
              validFrom: new Date().toISOString().slice(0, 10),
            }),
          },
          session.token
        );
      } else {
        await apiRequest(
          '/prices',
          {
            method: 'POST',
            body: JSON.stringify({
              countryId: selectedCountryId,
              phaseItemId: row.phaseItemId,
              unitPriceUsd: nextValue,
              validFrom: new Date().toISOString().slice(0, 10),
            }),
          },
          session.token
        );
      }

      const refreshed = await apiRequest<CountryItemPriceOption[]>('/prices', { method: 'GET' }, session.token);
      setCountryPrices(refreshed);
      triggerSaveFeedback('Precio guardado correctamente.', button);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar el precio';
      setError(message);
    }
  };

  const handleCreateClientFromQuote = async (button?: HTMLButtonElement | null) => {
    if (!session) return;
    if (!newClientDraft.countryId || !newClientDraft.name.trim()) {
      setError('Completa país y nombre para crear el cliente.');
      return;
    }

    try {
      const payload = cleanPayload({
        countryId: Number(newClientDraft.countryId),
        name: sanitizeText(newClientDraft.name) ?? '',
        legalName: sanitizeText(newClientDraft.legalName),
        taxId: sanitizeText(newClientDraft.taxId),
        contactName: sanitizeText(newClientDraft.contactName),
        email: sanitizeText(newClientDraft.email),
        phone: sanitizeText(newClientDraft.phone),
        address: sanitizeText(newClientDraft.address),
      });

      const created = await apiRequest<ClientOption>(
        '/clients',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
        session.token
      );

      const refreshed = await apiRequest<ClientOption[]>('/clients', { method: 'GET' }, session.token);
      setClients(refreshed);
      setQuoteForm((current) => ({ ...current, clientId: String(created.id) }));
      setNewClientDraft({ countryId: '', name: '', legalName: '', taxId: '', contactName: '', email: '', phone: '', address: '' });
      setShowNewClientForm(false);
      setError('');
      triggerSaveFeedback('Cliente guardado correctamente.', button);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo crear el cliente';
      setError(message);
    }
  };

  const handleCreateQuote = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) return;

    if (!quoteForm.clientId || !quoteForm.countryId || !quoteForm.title) {
      setError('Completa cliente, país y título para crear la cotización.');
      return;
    }

    const phasesPayload = phases
      .filter((phase) => selectedPhaseIds.includes(phase.id))
      .map((phase) => {
        const items = (quotePhaseDrafts[phase.id] ?? []).map((item) => ({
          catalogItemId: item.catalogItemId,
          quantity: Number(item.quantity || 0),
          days: Number(item.days || 0),
        }));
        return { phaseId: phase.id, items };
      })
      .filter((phase) => phase.items.length > 0);

    if (phasesPayload.length === 0) {
      setError('Debe definir al menos una fase con conceptos del Excel para generar la cotización.');
      return;
    }

    const payload: QuoteCreatePayload = {
      clientId: Number(quoteForm.clientId),
      countryId: Number(quoteForm.countryId),
      title: quoteForm.title,
      description: quoteForm.description || undefined,
      sampleSize: Number(quoteForm.sampleSize || 0),
      validUntil: quoteForm.validUntil || undefined,
      phases: phasesPayload,
    };

    setCreatingQuote(true);
    setError('');

    try {
      await apiRequest('/quotes', { method: 'POST', body: JSON.stringify(payload) }, session.token);
      setShowQuoteForm(false);
      setQuoteForm(initialForm);
      setQuotePhaseDrafts({});
      const refreshed = await apiRequest<QuoteListItem[]>('/quotes', { method: 'GET' }, session.token);
      setQuotes(refreshed);
      triggerSaveFeedback('Cotización guardada correctamente.', undefined);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo crear la cotización';
      setError(message);
    } finally {
      setCreatingQuote(false);
    }
  };

  const createCountryRecord = async (button?: HTMLButtonElement | null) => {
    if (!session) return;
    if (!countryDraft.name.trim() || !countryDraft.iso2.trim() || !countryDraft.iso3.trim() || !countryDraft.currencyId) {
      setError('Completa nombre, ISO y moneda del país.');
      return;
    }

    try {
      await apiRequest('/countries', {
        method: 'POST',
        body: JSON.stringify({
          name: sanitizeText(countryDraft.name) ?? '',
          iso2: sanitizeText(countryDraft.iso2)?.toUpperCase() ?? '',
          iso3: sanitizeText(countryDraft.iso3)?.toUpperCase() ?? '',
          currencyId: Number(countryDraft.currencyId),
          isDefault: Boolean(countryDraft.isDefault),
        }),
      }, session.token);

      const refreshed = await apiRequest<CountryOption[]>('/countries', { method: 'GET' }, session.token);
      setCountries(refreshed);
      setCountryDraft({ name: '', iso2: '', iso3: '', currencyId: '', isDefault: false });
      setError('');
      triggerSaveFeedback('País guardado correctamente.', button);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo crear el país';
      setError(message);
    }
  };

  const saveCountrySettingRecord = async (button?: HTMLButtonElement | null) => {
    if (!session) return;
    const countryId = Number(selectedMaintenanceCountryId || 0);
    if (!countryId) {
      setError('Selecciona un país antes de guardar los parámetros.');
      return;
    }

    const parseNullableNumber = (value: string) => (value.trim() === '' ? null : Number(value));

    const payload = {
      countryId,
      paymentIncreaseRatio: parseNullableNumber(countrySettingDraft.paymentIncreaseRatio),
      reducedDayDiscountRatio: parseNullableNumber(countrySettingDraft.reducedDayDiscountRatio),
      exchangeRate: parseNullableNumber(countrySettingDraft.exchangeRate),
      referenceDailySalaryLocal: parseNullableNumber(countrySettingDraft.referenceDailySalaryLocal),
      referenceDailySalaryUsd: parseNullableNumber(countrySettingDraft.referenceDailySalaryUsd),
      currencyCode: sanitizeText(countrySettingDraft.currencyCode) || undefined,
    };

    try {
      const existing = countryCalculationSettings.find((setting) => Number(setting.countryId) === countryId);
      if (existing?.id) {
        await apiRequest(`/country-calculation-settings/${existing.id}`, { method: 'PUT', body: JSON.stringify(payload) }, session.token);
      } else {
        await apiRequest('/country-calculation-settings', { method: 'POST', body: JSON.stringify(payload) }, session.token);
      }

      const refreshed = await apiRequest<CountryCalculationSettingOption[]>('/country-calculation-settings', { method: 'GET' }, session.token);
      setCountryCalculationSettings(refreshed);
      setCountrySettingDraft({ paymentIncreaseRatio: '', reducedDayDiscountRatio: '', exchangeRate: '', referenceDailySalaryLocal: '', referenceDailySalaryUsd: '', currencyCode: '' });
      setError('');
      triggerSaveFeedback('Parámetros del país guardados correctamente.', button);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar la configuración del país';
      setError(message);
    }
  };

  const saveCountryIncentiveRecord = async (button?: HTMLButtonElement | null) => {
    if (!session) return;
    const countryId = Number(countryIncentiveDraft.countryId || selectedMaintenanceCountryId || 0);
    if (!countryId) {
      setError('Selecciona un país para guardar el incentivo.');
      return;
    }

    const payload = {
      countryId,
      type: countryIncentiveDraft.type,
      unitValueUsd: Number(countryIncentiveDraft.unitValueUsd || 0),
      currencyCode: countryIncentiveDraft.currencyCode || 'USD',
    };

    try {
      const existing = countryIncentives.find((item) => Number(item.countryId) === countryId && item.type === payload.type);
      if (existing?.id) {
        await apiRequest(`/country-incentives/${existing.id}`, { method: 'PUT', body: JSON.stringify(payload) }, session.token);
      } else {
        await apiRequest('/country-incentives', { method: 'POST', body: JSON.stringify(payload) }, session.token);
      }

      const refreshed = await apiRequest<CountryIncentiveOption[]>('/country-incentives', { method: 'GET' }, session.token);
      setCountryIncentives(refreshed);
      setCountryIncentiveDraft({ countryId: String(countryId), type: 'PILOTO', unitValueUsd: '', currencyCode: 'USD' });
      setError('');
      triggerSaveFeedback('Incentivo guardado correctamente.', button);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar el incentivo';
      setError(message);
    }
  };

  const saveWorkPlanAssignment = async (button?: HTMLButtonElement | null) => {
    if (!session) return;
    const countryId = Number(workPlanDraft.countryId || selectedMaintenanceCountryId || 0);
    if (!countryId || !workPlanDraft.phaseId || !workPlanDraft.roleId) {
      setError('Completa país, fase, rol y cantidad para el plan de trabajo.');
      return;
    }

    const payload = {
      countryId,
      phaseId: Number(workPlanDraft.phaseId),
      roleId: Number(workPlanDraft.roleId),
      quantity: Number(workPlanDraft.quantity || 0),
    };

    try {
      const existing = workPlanAssignments.find(
        (item) => Number(item.countryId) === countryId && Number(item.phaseId) === payload.phaseId && Number(item.roleId) === payload.roleId
      );
      if (existing?.id) {
        await apiRequest(`/work-plan-assignments/${existing.id}`, { method: 'PUT', body: JSON.stringify(payload) }, session.token);
      } else {
        await apiRequest('/work-plan-assignments', { method: 'POST', body: JSON.stringify(payload) }, session.token);
      }

      const refreshed = await apiRequest<WorkPlanAssignmentOption[]>('/work-plan-assignments', { method: 'GET' }, session.token);
      setWorkPlanAssignments(refreshed);
      setWorkPlanDraft({ countryId: String(countryId), phaseId: '', roleId: '', quantity: '1' });
      setError('');
      triggerSaveFeedback('Plan de trabajo guardado correctamente.', button);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar el plan de trabajo';
      setError(message);
    }
  };

  const saveTeamConfiguration = async (button?: HTMLButtonElement | null) => {
    if (!session) return;
    const countryId = Number(teamConfigurationDraft.countryId || selectedMaintenanceCountryId || 0);
    if (!countryId || !teamConfigurationDraft.phaseId) {
      setError('Selecciona un país y una fase para guardar el equipo.');
      return;
    }

    const payload = {
      countryId,
      phaseId: Number(teamConfigurationDraft.phaseId),
      teamType: teamConfigurationDraft.teamType,
    };

    try {
      const existing = teamConfigurations.find(
        (item) => Number(item.countryId) === countryId && Number(item.phaseId) === payload.phaseId && item.teamType === payload.teamType
      );
      if (existing?.id) {
        await apiRequest(`/team-configurations/${existing.id}`, { method: 'PUT', body: JSON.stringify(payload) }, session.token);
      } else {
        await apiRequest('/team-configurations', { method: 'POST', body: JSON.stringify(payload) }, session.token);
      }

      const refreshed = await apiRequest<TeamConfigurationOption[]>('/team-configurations', { method: 'GET' }, session.token);
      setTeamConfigurations(refreshed);
      setTeamConfigurationDraft({ countryId: String(countryId), phaseId: '', teamType: 'LOCAL' });
      setError('');
      triggerSaveFeedback('Equipo guardado correctamente.', button);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar la configuración del equipo';
      setError(message);
    }
  };

  const createUserRecord = async (button?: HTMLButtonElement | null) => {
    if (!session) return;
    if (!userDraft.name.trim() || !userDraft.email.trim() || !userDraft.password.trim() || !userDraft.roleId) {
      setError('Completa nombre, correo, contraseña y rol para crear el usuario.');
      return;
    }

    try {
      const created = await apiRequest<UserListItem>(
        '/users',
        {
          method: 'POST',
          body: JSON.stringify({
            name: userDraft.name.trim(),
            email: userDraft.email.trim(),
            password: userDraft.password,
            roleId: Number(userDraft.roleId),
          }),
        },
        session.token
      );

      setUsers((current) => [created, ...current]);
      setUserDraft({ name: '', email: '', password: '', roleId: '' });
      setError('');
      triggerSaveFeedback('Usuario guardado correctamente.', button);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo crear el usuario';
      setError(message);
    }
  };

  const handleRolePermissionToggle = (roleId: number, moduleName: ModuleKey) => {
    setRolePermissionDrafts((current) => {
      const existing = current[roleId] ?? getPermissionStateFromRole(roles.find((role) => role.id === roleId)?.permissions);
      return {
        ...current,
        [roleId]: {
          ...existing,
          [moduleName]: !existing[moduleName],
        },
      };
    });
  };

  const createRoleRecord = async (button?: HTMLButtonElement | null) => {
    if (!session) return;
    if (!roleDraftName.trim()) {
      setError('Escribe el nombre del rol antes de guardarlo.');
      return;
    }

    try {
      const permissions = modules.map((module) => ({ module, view: Boolean(newRolePermissions[module]) }));
      await apiRequest<RoleOption>(
        '/roles',
        {
          method: 'POST',
          body: JSON.stringify({
            name: roleDraftName.trim(),
            permissions,
          }),
        },
        session.token
      );

      const refreshed = await apiRequest<RoleOption[]>('/roles', { method: 'GET' }, session.token);
      setRoles(refreshed);
      setRoleDraftName('');
      setNewRolePermissions({
        Dashboard: true,
        Cotizaciones: true,
        Mantenimientos: true,
        Rúbricas: true,
        Reportes: true,
        Usuarios: true,
      });
      setError('');
      triggerSaveFeedback('Rol guardado correctamente.', button);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar el rol';
      setError(message);
    }
  };

  const saveRoleSetting = async (role: RoleOption, button?: HTMLButtonElement | null) => {
    if (!session) return;
    const permissionState = rolePermissionDrafts[role.id] ?? getPermissionStateFromRole(role.permissions);
    const permissions = modules.map((module) => ({ module, view: Boolean(permissionState[module]) }));

    try {
      await apiRequest(
        `/roles/${role.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            name: role.name,
            permissions,
          }),
        },
        session.token
      );

      const refreshed = await apiRequest<RoleOption[]>('/roles', { method: 'GET' }, session.token);
      setRoles(refreshed);
      setRolePermissionDrafts((current) => ({ ...current, [role.id]: getPermissionStateFromRole(refreshed.find((item) => item.id === role.id)?.permissions) }));
      setError('');
      triggerSaveFeedback('Permisos del rol actualizados correctamente.', button);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo actualizar el rol';
      setError(message);
    }
  };

  const createClientRecord = async (button?: HTMLButtonElement | null) => {
    if (!session) return;
    if (!clientDraft.countryId || !clientDraft.name.trim()) {
      setError('Completa país y nombre del cliente.');
      return;
    }

    try {
      const payload = cleanPayload({
        countryId: Number(clientDraft.countryId),
        name: sanitizeText(clientDraft.name) ?? '',
        legalName: sanitizeText(clientDraft.legalName),
        taxId: sanitizeText(clientDraft.taxId),
        contactName: sanitizeText(clientDraft.contactName),
        email: sanitizeText(clientDraft.email),
        phone: sanitizeText(clientDraft.phone),
        address: sanitizeText(clientDraft.address),
      });

      await apiRequest('/clients', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, session.token);

      const refreshed = await apiRequest<ClientOption[]>('/clients', { method: 'GET' }, session.token);
      setClients(refreshed);
      setClientDraft({ countryId: '', name: '', legalName: '', taxId: '', contactName: '', email: '', phone: '', address: '' });
      setError('');
      triggerSaveFeedback('Cliente guardado correctamente.', button);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo crear el cliente';
      setError(message);
    }
  };

  const createPhaseRecord = async (button?: HTMLButtonElement | null) => {
    if (!session) return;
    if (!phaseDraft.name.trim() || !phaseDraft.code.trim()) {
      setError('Completa nombre y código de la fase.');
      return;
    }

    try {
      await apiRequest('/phases', {
        method: 'POST',
        body: JSON.stringify({
          name: phaseDraft.name.trim(),
          code: phaseDraft.code.trim(),
          sortOrder: Number(phaseDraft.sortOrder || 0),
        }),
      }, session.token);

      const refreshed = await apiRequest<PhaseOption[]>('/phases', { method: 'GET' }, session.token);
      setPhases(refreshed);
      setPhaseDraft({ name: '', code: '', sortOrder: '0' });
      setError('');
      triggerSaveFeedback('Fase guardada correctamente.', button);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo crear la fase';
      setError(message);
    }
  };

  const createCatalogItemRecord = async (button?: HTMLButtonElement | null) => {
    if (!session) return;
    if (!catalogDraft.categoryId || !catalogDraft.name.trim() || !catalogDraft.code.trim()) {
      setError('Completa categoría, nombre y código del concepto.');
      return;
    }

    try {
      await apiRequest('/catalog-items', {
        method: 'POST',
        body: JSON.stringify({
          categoryId: Number(catalogDraft.categoryId),
          name: catalogDraft.name.trim(),
          code: catalogDraft.code.trim(),
          unitLabel: catalogDraft.unitLabel || 'unidad',
        }),
      }, session.token);

      const refreshed = await apiRequest<CatalogItemOption[]>('/catalog-items', { method: 'GET' }, session.token);
      setCatalogItems(refreshed);
      setCatalogDraft({ categoryId: '', code: '', name: '', unitLabel: 'unidad' });
      setError('');
      triggerSaveFeedback('Concepto guardado correctamente.', button);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo crear el concepto';
      setError(message);
    }
  };

  const createRuleRecord = async (button?: HTMLButtonElement | null) => {
    if (!session) return;
    if (!ruleDraft.code.trim() || !ruleDraft.name.trim()) {
      setError('Completa código y nombre de la regla.');
      return;
    }

    try {
      await apiRequest('/calculation-rules', {
        method: 'POST',
        body: JSON.stringify({
          code: ruleDraft.code.trim(),
          name: ruleDraft.name.trim(),
          ruleType: ruleDraft.ruleType,
          paramsJson: JSON.parse(ruleDraft.paramsJson || '{}'),
          phaseItemId: ruleDraft.phaseItemId ? Number(ruleDraft.phaseItemId) : null,
        }),
      }, session.token);

      const refreshed = await apiRequest<CalculationRuleOption[]>('/calculation-rules', { method: 'GET' }, session.token);
      setCalculationRules(refreshed);
      setRuleDraft({ code: '', name: '', ruleType: 'LINE_TOTAL', paramsJson: '{"multiplier":1}', phaseItemId: '' });
      setError('');
      triggerSaveFeedback('Regla guardada correctamente.', button);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo crear la regla';
      setError(message);
    }
  };

  const handleDuplicateQuote = async (quoteId: number) => {
    if (!session) return;
    setError('');

    try {
      await apiRequest(`/quotes/${quoteId}/duplicate`, { method: 'POST' }, session.token);
      const refreshed = await apiRequest<QuoteListItem[]>('/quotes', { method: 'GET' }, session.token);
      setQuotes(refreshed);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo duplicar la cotización';
      setError(message);
    }
  };

  const handleStatusChange = async (quoteId: number, status: string) => {
    if (!session) return;
    setError('');

    try {
      await apiRequest(`/quotes/${quoteId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, session.token);
      const refreshed = await apiRequest<QuoteListItem[]>('/quotes', { method: 'GET' }, session.token);
      setQuotes(refreshed);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo actualizar el estado';
      setError(message);
    }
  };

  const handleOpenQuoteModal = async (quote: QuoteListItem) => {
    if (!session) return;

    setSelectedQuote(quote);
    setQuoteEditor({
      title: quote.title,
      description: '',
      status: quote.status,
      clientId: String(quote.client?.id ?? ''),
      countryId: String(quote.country?.id ?? ''),
      sampleSize: String(quote.sampleSize ?? 0),
      validUntil: quote.validUntil ?? '',
    });
    setQuoteDetail(null);
    setError('');

    try {
      const payload = await apiRequest<QuoteDetail>(`/quotes/${quote.id}`, { method: 'GET' }, session.token);
      setQuoteDetail(payload);
      setQuoteEditor({
        title: payload.title,
        description: payload.description ?? '',
        status: payload.status,
        clientId: String(payload.client?.id ?? ''),
        countryId: String(payload.country?.id ?? ''),
        sampleSize: String(payload.sampleSize ?? 0),
        validUntil: payload.validUntil ?? '',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo cargar la cotización';
      setError(message);
    }
  };

  const handleDeleteQuote = async (quoteId: number) => {
    if (!session) return;
    setError('');

    try {
      await apiRequest(`/quotes/${quoteId}`, { method: 'DELETE' }, session.token);
      const refreshed = await apiRequest<QuoteListItem[]>('/quotes', { method: 'GET' }, session.token);
      setQuotes(refreshed);
      if (selectedQuote?.id === quoteId) {
        setSelectedQuote(null);
        setQuoteEditor(null);
        setQuoteDetail(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo eliminar la cotización';
      setError(message);
    }
  };

  const handleSaveQuoteEdition = async (button?: HTMLButtonElement | null) => {
    if (!session || !selectedQuote || !quoteEditor) return;
    setError('');

    const phasesPayload = (quoteDetail?.phases ?? []).map((phase) => ({
      phaseId: phase.phaseId,
      items: (phase.items ?? []).map((item) => ({
        catalogItemId: item.catalogItemId,
        quantity: Number(item.quantity || 0),
        days: Number(item.days || 0),
      })),
    })).filter((phase) => phase.items.length > 0);

    try {
      await apiRequest(
        `/quotes/${selectedQuote.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            title: quoteEditor.title,
            description: quoteEditor.description,
            status: quoteEditor.status,
            clientId: Number(quoteEditor.clientId || 0),
            countryId: Number(quoteEditor.countryId || 0),
            sampleSize: Number(quoteEditor.sampleSize || 0),
            validUntil: quoteEditor.validUntil || null,
            phases: phasesPayload,
          }),
        },
        session.token
      );

      const refreshed = await apiRequest<QuoteListItem[]>('/quotes', { method: 'GET' }, session.token);
      setQuotes(refreshed);
      setSelectedQuote(null);
      setQuoteEditor(null);
      setQuoteDetail(null);
      triggerSaveFeedback('Cambios de cotización guardados correctamente.', button);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar la edición';
      setError(message);
    }
  };

  const getPhaseSubtotal = (detail: QuoteDetail | null, phaseName: string) => {
    if (!detail) return 0;
    const phase = detail.phases?.find((entry) => entry.phaseNameSnapshot.toLowerCase() === phaseName.toLowerCase());
    return Number(phase?.subtotalUsd ?? 0);
  };

  const getPhaseLocalSubtotal = (detail: QuoteDetail | null, phaseName: string) => {
    if (!detail) return 0;
    const phase = detail.phases?.find((entry) => entry.phaseNameSnapshot.toLowerCase() === phaseName.toLowerCase());
    return Number(phase?.subtotalLocal ?? 0);
  };

  const getItemsByPhaseAndText = (detail: QuoteDetail | null, phaseName: string, text: string) => {
    if (!detail) return 0;

    return (detail.phases ?? []).reduce((sum, phase) => {
      if (phase.phaseNameSnapshot.toLowerCase() !== phaseName.toLowerCase()) return sum;
      return sum + (phase.items ?? []).reduce((phaseSum, item) => {
        const itemText = `${item.itemNameSnapshot ?? ''} ${item.categorySnapshot ?? ''}`.toLowerCase();
        if (!itemText.includes(text.toLowerCase())) return phaseSum;
        return phaseSum + Number(item.totalUsd ?? 0);
      }, 0);
    }, 0);
  };

  const getItemsByText = (detail: QuoteDetail | null, text: string) => {
    if (!detail) return 0;

    return (detail.phases ?? []).reduce((sum, phase) => {
      return sum + (phase.items ?? []).reduce((phaseSum, item) => {
        const itemText = `${item.itemNameSnapshot ?? ''} ${item.categorySnapshot ?? ''}`.toLowerCase();
        if (!itemText.includes(text.toLowerCase())) return phaseSum;
        return phaseSum + Number(item.totalUsd ?? 0);
      }, 0);
    }, 0);
  };

  const getSummaryValue = (detail: QuoteDetail | null, label: string) => {
    if (!detail) return 0;
    const line = (detail.summaryLines ?? []).find((entry) => entry.label.toLowerCase() === label.toLowerCase());
    return Number(line?.valueUsd ?? 0);
  };

  const buildRubricData = (detail: QuoteDetail | null) => {
    const totalCosts = [
      { rubro: 'Piloto', costsTotales: getPhaseSubtotal(detail, 'Piloto'), datos: getItemsByPhaseAndText(detail, 'Piloto', 'datos'), transpYViaticos: getItemsByPhaseAndText(detail, 'Piloto', 'viático'), materiales: getItemsByPhaseAndText(detail, 'Piloto', 'material'), valorTotalOp: getPhaseSubtotal(detail, 'Piloto'), incentivos: getItemsByText(detail, 'incentivo'), costoUnit: 0, costoTotal: getPhaseSubtotal(detail, 'Piloto') + getItemsByText(detail, 'incentivo') },
      { rubro: 'Capacitación', costsTotales: getPhaseSubtotal(detail, 'Capacitación'), datos: 0, transpYViaticos: 0, materiales: 0, valorTotalOp: getPhaseSubtotal(detail, 'Capacitación'), incentivos: 0, costoUnit: 0, costoTotal: getPhaseSubtotal(detail, 'Capacitación') },
      { rubro: 'Levantamiento', costsTotales: getPhaseSubtotal(detail, 'Levantamiento'), datos: getItemsByPhaseAndText(detail, 'Datos, conexión y salas de trabajo', 'datos'), transpYViaticos: getItemsByPhaseAndText(detail, 'Levantamiento', 'viático'), materiales: getItemsByPhaseAndText(detail, 'Levantamiento', 'material'), valorTotalOp: getPhaseSubtotal(detail, 'Levantamiento'), incentivos: 0, costoUnit: 0, costoTotal: getPhaseSubtotal(detail, 'Levantamiento') },
      { rubro: 'Materiales levantamiento y otros', costsTotales: getItemsByText(detail, 'tablets') + getItemsByText(detail, 'grabadora') + getItemsByText(detail, 'batería') + getItemsByText(detail, 'chaleco') + getItemsByText(detail, 'seguro') + getItemsByText(detail, 'administrativos'), datos: 0, transpYViaticos: 0, materiales: getItemsByText(detail, 'tablets') + getItemsByText(detail, 'grabadora') + getItemsByText(detail, 'batería') + getItemsByText(detail, 'chaleco') + getItemsByText(detail, 'seguro') + getItemsByText(detail, 'administrativos'), valorTotalOp: getItemsByText(detail, 'tablets') + getItemsByText(detail, 'grabadora') + getItemsByText(detail, 'batería') + getItemsByText(detail, 'chaleco') + getItemsByText(detail, 'seguro') + getItemsByText(detail, 'administrativos'), incentivos: 0, costoUnit: 0, costoTotal: getItemsByText(detail, 'tablets') + getItemsByText(detail, 'grabadora') + getItemsByText(detail, 'batería') + getItemsByText(detail, 'chaleco') + getItemsByText(detail, 'seguro') + getItemsByText(detail, 'administrativos') },
      { rubro: 'Transporte y viáticos Levantamiento', costsTotales: getItemsByText(detail, 'hotel') + getItemsByText(detail, 'alimentación') + getItemsByText(detail, 'transporte'), datos: 0, transpYViaticos: getItemsByText(detail, 'hotel') + getItemsByText(detail, 'alimentación') + getItemsByText(detail, 'transporte'), materiales: 0, valorTotalOp: getItemsByText(detail, 'hotel') + getItemsByText(detail, 'alimentación') + getItemsByText(detail, 'transporte'), incentivos: 0, costoUnit: 0, costoTotal: getItemsByText(detail, 'hotel') + getItemsByText(detail, 'alimentación') + getItemsByText(detail, 'transporte') },
      { rubro: 'Datos conexión y Salas de trabajo', costsTotales: getItemsByText(detail, 'datos') + getItemsByText(detail, 'conexión') + getItemsByText(detail, 'sala'), datos: getItemsByText(detail, 'datos') + getItemsByText(detail, 'conexión') + getItemsByText(detail, 'sala'), transpYViaticos: 0, materiales: 0, valorTotalOp: getItemsByText(detail, 'datos') + getItemsByText(detail, 'conexión') + getItemsByText(detail, 'sala'), incentivos: 0, costoUnit: 0, costoTotal: getItemsByText(detail, 'datos') + getItemsByText(detail, 'conexión') + getItemsByText(detail, 'sala') },
      { rubro: 'Total Operación', costsTotales: getSummaryValue(detail, 'Total Operación'), datos: 0, transpYViaticos: 0, materiales: 0, valorTotalOp: getSummaryValue(detail, 'Total Operación'), incentivos: 0, costoUnit: 0, costoTotal: getSummaryValue(detail, 'Total Operación') },
      { rubro: 'Incentivos', costsTotales: getSummaryValue(detail, 'Incentivos'), datos: 0, transpYViaticos: 0, materiales: 0, valorTotalOp: getSummaryValue(detail, 'Incentivos'), incentivos: getSummaryValue(detail, 'Incentivos'), costoUnit: 0, costoTotal: getSummaryValue(detail, 'Incentivos') },
      { rubro: 'Total', costsTotales: getSummaryValue(detail, 'Total'), datos: 0, transpYViaticos: 0, materiales: 0, valorTotalOp: getSummaryValue(detail, 'Total'), incentivos: getSummaryValue(detail, 'Incentivos'), costoUnit: 0, costoTotal: getSummaryValue(detail, 'Total') },
      { rubro: 'Costos finales', costsTotales: getSummaryValue(detail, 'Costo interno estimado'), datos: 0, transpYViaticos: 0, materiales: 0, valorTotalOp: getSummaryValue(detail, 'Costo interno estimado'), incentivos: 0, costoUnit: 0, costoTotal: getSummaryValue(detail, 'Costo interno estimado') },
      { rubro: 'Margen esperado', costsTotales: getSummaryValue(detail, 'Margen esperado'), datos: 0, transpYViaticos: 0, materiales: 0, valorTotalOp: getSummaryValue(detail, 'Margen esperado'), incentivos: 0, costoUnit: 0, costoTotal: getSummaryValue(detail, 'Margen esperado') },
    ];

    const localCosts = [
      { rubro: 'Piloto', valor: getPhaseLocalSubtotal(detail, 'Piloto') },
      { rubro: 'Previsita', valor: getPhaseLocalSubtotal(detail, 'Previsita') },
      { rubro: 'Capacitación inicial', valor: getPhaseLocalSubtotal(detail, 'Capacitación inicial') },
      { rubro: 'Capacitación', valor: getPhaseLocalSubtotal(detail, 'Capacitación') },
      { rubro: 'Mantenimiento', valor: getPhaseLocalSubtotal(detail, 'Mantenimiento') },
      { rubro: 'Revisita', valor: getPhaseLocalSubtotal(detail, 'Revisita') },
      { rubro: 'Levantamiento', valor: getPhaseLocalSubtotal(detail, 'Levantamiento') },
      { rubro: 'Materiales levantamiento y otros', valor: getItemsByText(detail, 'tablets') + getItemsByText(detail, 'grabadora') + getItemsByText(detail, 'batería') + getItemsByText(detail, 'chaleco') + getItemsByText(detail, 'seguro') + getItemsByText(detail, 'administrativos') },
      { rubro: 'Transporte y viáticos Levantamiento', valor: getItemsByText(detail, 'hotel') + getItemsByText(detail, 'alimentación') + getItemsByText(detail, 'transporte') },
      { rubro: 'Datos conexión y Salas de trabajo', valor: getItemsByText(detail, 'datos') + getItemsByText(detail, 'conexión') + getItemsByText(detail, 'sala') },
      { rubro: 'Costos locales', valor: (detail?.phases ?? []).reduce((sum, phase) => sum + Number(phase.subtotalLocal ?? 0), 0) },
      { rubro: 'Incentivos', valor: getSummaryValue(detail, 'Incentivos') },
      { rubro: 'Costos locales totales', valor: (detail?.phases ?? []).reduce((sum, phase) => sum + Number(phase.subtotalLocal ?? 0), 0) + getSummaryValue(detail, 'Incentivos') },
    ];

    const scenarioComparison = [
      { rubro: 'Piloto', scenarioA: 0, scenarioB: 0 },
      { rubro: 'Capacitación inicial mixta', scenarioA: 0, scenarioB: 0 },
      { rubro: 'Capacitación', scenarioA: 0, scenarioB: 0 },
      { rubro: 'Previsita', scenarioA: 0, scenarioB: 0 },
      { rubro: 'Precontacto', scenarioA: 0, scenarioB: 0 },
      { rubro: 'Levantamiento', scenarioA: 0, scenarioB: 0 },
      { rubro: 'Revisita', scenarioA: 0, scenarioB: 0 },
      { rubro: 'Materiales levantamiento y otros', scenarioA: 0, scenarioB: 0 },
      { rubro: 'Transporte y viáticos Levantamiento', scenarioA: 0, scenarioB: 0 },
      { rubro: 'Datos conexión y Salas de trabajo', scenarioA: 0, scenarioB: 0 },
      { rubro: 'Total Operación', scenarioA: 0, scenarioB: 0 },
      { rubro: 'Incentivos', scenarioA: 0, scenarioB: 0 },
      { rubro: 'Total', scenarioA: 0, scenarioB: 0 },
    ];

    const commerceVersion = [
      { rubro: 'Piloto', household: 0, business: 0 },
      { rubro: 'Capacitación inicial mixta', household: 0, business: 0 },
      { rubro: 'Capacitación', household: 0, business: 0 },
      { rubro: 'Previsita', household: 0, business: 0 },
      { rubro: 'Precontacto', household: 0, business: 0 },
      { rubro: 'Levantamiento', household: 0, business: 0 },
      { rubro: 'Revisita', household: 0, business: 0 },
      { rubro: 'Materiales levantamiento y otros', household: 0, business: 0 },
      { rubro: 'Transporte y viáticos Levantamiento', household: 0, business: 0 },
      { rubro: 'Datos conexión y Salas de trabajo', household: 0, business: 0 },
      { rubro: 'Levantamiento Comercios', household: 0, business: 0 },
      { rubro: 'Total Operación', household: 0, business: 0 },
      { rubro: 'Incentivos (Hogares y Comercios)', household: 0, business: 0 },
      { rubro: 'Total', household: 0, business: 0 },
    ];

    return { totalCosts, localCosts, scenarioComparison, commerceVersion };
  };

  useEffect(() => {
    if (!session || !selectedRubricQuoteId) return;

    const loadRubricQuote = async () => {
      try {
        const payload = await apiRequest<QuoteDetail>(`/quotes/${selectedRubricQuoteId}`, { method: 'GET' }, session.token);
        setRubricQuoteDetail(payload);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo cargar la cotización seleccionada';
        setError(message);
      }
    };

    void loadRubricQuote();
  }, [selectedRubricQuoteId, session]);

  useEffect(() => {
    if (selectedModule !== 'Rúbricas' || !session || quotes.length === 0) return;

    if (!selectedRubricQuoteId) {
      setSelectedRubricQuoteId(quotes[0].id);
    }
  }, [quotes, selectedModule, selectedRubricQuoteId, session]);

  const rubricData = buildRubricData(rubricQuoteDetail);

  return (
    <div className="app-shell">
      <main className="content-panel">
        {!session ? (
          <section className="login-card">
            <div className="login-header">
              <span className="badge">Acceso seguro</span>
              <h2>Iniciar sesión</h2>
            </div>

            <form onSubmit={handleSubmit}>
              <label className="field">
                <span>Correo electrónico</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@empresa.com"
                  required
                />
              </label>

              <label className="field">
                <span>Contraseña</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </label>

              <div className="login-meta">
                <label className="remember-me">
                  <input type="checkbox" defaultChecked />
                  <span>Recordarme</span>
                </label>
                <button type="button" className="text-button">¿Olvidaste tu contraseña?</button>
              </div>

              {error ? <div className="error-box">{error}</div> : null}

              <button type="submit" className="primary-button" disabled={loading}>
                {loading ? 'Ingresando...' : 'Entrar al sistema'}
              </button>
            </form>
          </section>
        ) : (
          <>
            <header className="topbar">
              <div>
                <p className="eyebrow muted">Panel principal</p>
                <h2>{selectedModule === 'Cotizaciones' ? 'Cotizaciones' : 'Dashboard ejecutivo'}</h2>
              </div>

              <div className="topbar-actions">
                <div className="user-pill">
                  <span className="user-dot" />
                  <div>
                    <strong>{session.user.name}</strong>
                    <small>{roleLabel}</small>
                  </div>
                </div>
                <button type="button" className="ghost-button">Exportar</button>
                <button type="button" className="primary-button small" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </div>
            </header>

            {successMessage ? <div className="success-box">{successMessage}</div> : null}

            <nav className="module-tabs" aria-label="Módulos">
              {visibleModules.map((module) => (
                <button
                  key={module}
                  type="button"
                  className={module === selectedModule ? 'tab active' : 'tab'}
                  onClick={() => setSelectedModule(module)}
                >
                  {module}
                </button>
              ))}
            </nav>

            {selectedModule === 'Dashboard' ? (
              <>
                <section className="stats-grid">
                  {stats.map((stat) => (
                    <article key={stat.label} className="stat-card">
                      <span>{stat.label}</span>
                      <strong>{stat.value}</strong>
                      <em>{stat.delta}</em>
                    </article>
                  ))}
                </section>

                <section className="content-grid">
                  <article className="quote-card wide">
                    <div className="card-head">
                      <h3>Cotizaciones recientes</h3>
                      <button type="button" className="text-button" onClick={() => setSelectedModule('Cotizaciones')}>
                        Ver todas
                      </button>
                    </div>

                    <table>
                      <thead>
                        <tr>
                          <th>Proyecto</th>
                          <th>Cliente</th>
                          <th>País</th>
                          <th>Importe</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quotesLoading ? (
                          <tr>
                            <td colSpan={5}>Cargando cotizaciones...</td>
                          </tr>
                        ) : quoteRows.length === 0 ? (
                          <tr>
                            <td colSpan={5}>No hay cotizaciones disponibles</td>
                          </tr>
                        ) : (
                          quoteRows.map((row) => (
                            <tr key={`${row.name}-${row.country}`}>
                              <td>{row.name}</td>
                              <td>{row.client}</td>
                              <td>{row.country}</td>
                              <td>{row.amount}</td>
                              <td>
                                <span className={`status ${formatStatusClass(row.status)}`}>
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </article>

                  <aside className="quote-card aside-card">
                    <div className="card-head">
                      <h3>Resumen</h3>
                      <span className="chip neutral">Hoy</span>
                    </div>

                    <div className="summary-stack">
                      <div>
                        <span>Ingresos proyectados</span>
                        <strong>{quotes.length ? `${quotes.length * 12}K` : '$0K'}</strong>
                      </div>
                      <div>
                        <span>Costos estimados</span>
                        <strong>{quotes.length ? `${quotes.length * 8}K` : '$0K'}</strong>
                      </div>
                      <div>
                        <span>Margen esperado</span>
                        <strong>{quotes.length ? `${Math.min(99, quotes.length * 5)}%` : '0%'}</strong>
                      </div>
                    </div>

                    <div className="sparkline" aria-hidden="true">
                      <span className="bar b1" />
                      <span className="bar b2" />
                      <span className="bar b3" />
                      <span className="bar b4" />
                      <span className="bar b5" />
                      <span className="bar b6" />
                      <span className="bar b7" />
                    </div>
                  </aside>
                </section>
              </>
            ) : null}

            {canAccessModule('Rúbricas') && selectedModule === 'Rúbricas' ? (
              <section className="quote-module-container">
                <div className="card-head module-head rubrics-header">
                  <h3>Rúbricas de cotización</h3>
                  {quotes.length > 0 ? (
                    <select
                      value={selectedRubricQuoteId ?? ''}
                      onChange={(event) => setSelectedRubricQuoteId(Number(event.target.value))}
                    >
                      {quotes.map((quote) => (
                        <option key={quote.id} value={quote.id}>{quote.title}</option>
                      ))}
                    </select>
                  ) : null}
                </div>

                {rubricQuoteDetail ? (
                  <div className="rubric-shell">
                    <article className="rubric-card">
                      <div className="rubric-title">BLOQUE 1 - RUBRO - COSTOS TOTALES</div>
                      <div className="rubric-table-wrap">
                        <table className="rubric-table">
                          <thead>
                            <tr>
                              <th>Rubro</th>
                              <th>Costos Totales</th>
                              <th>Datos</th>
                              <th>Transp y Viáticos</th>
                              <th>Materiales</th>
                              <th>Valor Total Op.</th>
                              <th>Incentivos</th>
                              <th>Costo Unit.</th>
                              <th>Costo Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rubricData.totalCosts.map((row) => (
                              <tr key={row.rubro}>
                                <td>{row.rubro}</td>
                                <td>{formatMoney(row.costsTotales, rubricQuoteDetail.country?.id)}</td>
                                <td>{formatMoney(row.datos, rubricQuoteDetail.country?.id)}</td>
                                <td>{formatMoney(row.transpYViaticos, rubricQuoteDetail.country?.id)}</td>
                                <td>{formatMoney(row.materiales, rubricQuoteDetail.country?.id)}</td>
                                <td>{formatMoney(row.valorTotalOp, rubricQuoteDetail.country?.id)}</td>
                                <td>{formatMoney(row.incentivos, rubricQuoteDetail.country?.id)}</td>
                                <td>{formatMoney(row.costoUnit, rubricQuoteDetail.country?.id)}</td>
                                <td>{formatMoney(row.costoTotal, rubricQuoteDetail.country?.id)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </article>

                    <article className="rubric-card">
                      <div className="rubric-title">BLOQUE 2 - RUBRO - COSTOS LOCALES</div>
                      <div className="rubric-table-wrap">
                        <table className="rubric-table">
                          <thead>
                            <tr>
                              <th>Rubro</th>
                              <th>Valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rubricData.localCosts.map((row) => (
                              <tr key={row.rubro}>
                                <td>{row.rubro}</td>
                                <td>{formatMoney(row.valor, rubricQuoteDetail.country?.id)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </article>

                    <article className="rubric-card">
                      <div className="rubric-title">BLOQUE 3 - COMPARACIÓN DE ESCENARIOS</div>
                      <div className="rubric-table-wrap">
                        <table className="rubric-table">
                          <thead>
                            <tr>
                              <th>Rubro</th>
                              <th>N=960</th>
                              <th>N=1560</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rubricData.scenarioComparison.map((row) => (
                              <tr key={row.rubro}>
                                <td>{row.rubro}</td>
                                <td>{formatMoney(row.scenarioA, rubricQuoteDetail.country?.id)}</td>
                                <td>{formatMoney(row.scenarioB, rubricQuoteDetail.country?.id)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </article>

                    <article className="rubric-card">
                      <div className="rubric-title">BLOQUE 4 - VERSIÓN CON COMERCIOS</div>
                      <div className="rubric-table-wrap">
                        <table className="rubric-table">
                          <thead>
                            <tr>
                              <th>Rubro</th>
                              <th>N=960 Hogares y M=240 Comercios</th>
                              <th>N=1560 Hogares y M=360 Comercios</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rubricData.commerceVersion.map((row) => (
                              <tr key={row.rubro}>
                                <td>{row.rubro}</td>
                                <td>{formatMoney(row.household, rubricQuoteDetail.country?.id)}</td>
                                <td>{formatMoney(row.business, rubricQuoteDetail.country?.id)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </article>
                  </div>
                ) : (
                  <div className="empty-detail">Selecciona una cotización para cargar sus rúbricas.</div>
                )}
              </section>
            ) : null}

            {canAccessModule('Reportes') && selectedModule === 'Reportes' ? (
              <section className="quote-module-container">
                <div className="card-head module-head">
                  <h3>Reportes</h3>
                </div>

                <div className="stats-grid">
                  <article className="stat-card">
                    <span>Total cotizaciones</span>
                    <strong>{quotes.length}</strong>
                    <em>{quotes.length ? 'Registradas' : 'Sin datos'}</em>
                  </article>
                  <article className="stat-card">
                    <span>Usuarios activos</span>
                    <strong>{users.filter((user) => user.active).length}</strong>
                    <em>En el sistema</em>
                  </article>
                  <article className="stat-card">
                    <span>Aprobadas</span>
                    <strong>{quotes.filter((quote) => quote.status === 'APROBADA').length}</strong>
                    <em>Vigentes</em>
                  </article>
                  <article className="stat-card">
                    <span>En revisión</span>
                    <strong>{quotes.filter((quote) => quote.status === 'EN_REVISION').length}</strong>
                    <em>Pendientes</em>
                  </article>
                </div>

                <article className="quote-card wide">
                  <div className="card-head">
                    <h3>Estado por cotización</h3>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Proyecto</th>
                        <th>Cliente</th>
                        <th>País</th>
                        <th>Estado</th>
                        <th>Margen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotes.length === 0 ? (
                        <tr>
                          <td colSpan={5}>No hay cotizaciones para reportar.</td>
                        </tr>
                      ) : (
                        quotes.slice(0, 8).map((quote) => (
                          <tr key={quote.id}>
                            <td>{quote.title}</td>
                            <td>{quote.client?.name ?? '—'}</td>
                            <td>{quote.country?.name ?? '—'}</td>
                            <td><span className={`status ${formatStatusClass(quote.status)}`}>{quote.status}</span></td>
                            <td>{quote.marginPercent !== null && quote.marginPercent !== undefined ? `${Number(quote.marginPercent).toFixed(1)}%` : '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </article>
              </section>
            ) : null}

            {canAccessModule('Usuarios') && selectedModule === 'Usuarios' ? (
              <section className="quote-module-container">
                <div className="card-head module-head">
                  <h3>Usuarios</h3>
                </div>

                <div className="mini-form-grid">
                  <label className="field">
                    <span>Nombre</span>
                    <input value={userDraft.name} onChange={(e) => setUserDraft((current) => ({ ...current, name: e.target.value }))} placeholder="Ej: Ana López" />
                  </label>
                  <label className="field">
                    <span>Correo</span>
                    <input type="email" value={userDraft.email} onChange={(e) => setUserDraft((current) => ({ ...current, email: e.target.value }))} placeholder="usuario@empresa.com" />
                  </label>
                  <label className="field">
                    <span>Contraseña</span>
                    <input type="password" value={userDraft.password} onChange={(e) => setUserDraft((current) => ({ ...current, password: e.target.value }))} placeholder="••••••••" />
                  </label>
                  <label className="field">
                    <span>Rol</span>
                    <select value={userDraft.roleId} onChange={(e) => setUserDraft((current) => ({ ...current, roleId: e.target.value }))}>
                      <option value="">Selecciona un rol</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <button type="button" className="primary-button small" onClick={(event) => void createUserRecord(event.currentTarget)}>Crear usuario</button>

                <div className="quote-table-wrap" style={{ marginTop: 20 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Correo</th>
                        <th>Rol</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={4}>No hay usuarios registrados.</td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user.id}>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>{user.role?.name ?? '—'}</td>
                            <td>
                              <span className={`status ${user.active ? 'aprobada' : 'cancelada'}`}>
                                {user.active ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            {canAccessModule('Mantenimientos') && selectedModule === 'Mantenimientos' ? (
              <section className="quote-module-container">
                <div className="card-head module-head">
                  <h3>Mantenimientos del sistema</h3>
                </div>

                <div className="maintenance-layout">
                  <aside className="maintenance-aside">
                    {[
                      { key: 'roles', label: 'Roles' },
                      { key: 'cotizaciones', label: 'Cotizaciones' },
                      { key: 'paises', label: 'Países' },
                      { key: 'parametros', label: 'Parámetros por país' },
                      { key: 'incentivos', label: 'Incentivos' },
                      { key: 'planTrabajo', label: 'Plan de trabajo' },
                      { key: 'equipos', label: 'Equipos por fase' },
                      { key: 'clientes', label: 'Clientes' },
                      { key: 'fases', label: 'Fases' },
                      { key: 'conceptos', label: 'Conceptos' },
                      { key: 'precios', label: 'Precios' },
                      { key: 'tiposCambio', label: 'Tipos de cambio' },
                      { key: 'reglas', label: 'Fórmulas / reglas' },
                    ].map((section) => (
                      <button
                        key={section.key}
                        type="button"
                        className={maintenanceSection === section.key ? 'maintenance-tab active' : 'maintenance-tab'}
                        onClick={() => setMaintenanceSection(section.key as typeof maintenanceSection)}
                      >
                        {section.label}
                      </button>
                    ))}
                  </aside>

                  <div className="maintenance-content">
                    {maintenanceSection === 'roles' ? (
                      <div className="maintenance-section-panel">
                        <div className="card-head module-head">
                          <h3>Roles y permisos</h3>
                        </div>

                        <div className="mini-form-grid">
                          <label className="field wide">
                            <span>Nombre del rol</span>
                            <input value={roleDraftName} onChange={(e) => setRoleDraftName(e.target.value)} placeholder="Ej: Analista comercial" />
                          </label>
                        </div>

                        <div className="mini-form-grid">
                          {modules.map((module) => (
                            <label key={module} className="field checkbox-field">
                              <input type="checkbox" checked={newRolePermissions[module]} onChange={() => setNewRolePermissions((current) => ({ ...current, [module]: !current[module] }))} />
                              <span>{module}</span>
                            </label>
                          ))}
                        </div>

                        <button type="button" className="primary-button small" onClick={(event) => void createRoleRecord(event.currentTarget)}>Guardar rol</button>

                        <div className="quote-table-wrap" style={{ marginTop: 20 }}>
                          <table>
                            <thead>
                              <tr>
                                <th>Rol</th>
                                <th>Permisos</th>
                                <th>Guardar</th>
                              </tr>
                            </thead>
                            <tbody>
                              {roles.length === 0 ? (
                                <tr>
                                  <td colSpan={3}>No hay roles configurados.</td>
                                </tr>
                              ) : (
                                roles.map((role) => {
                                  const state = rolePermissionDrafts[role.id] ?? getPermissionStateFromRole(role.permissions);
                                  return (
                                    <tr key={role.id}>
                                      <td>
                                        <input
                                          value={role.name}
                                          onChange={(e) => setRoles((current) => current.map((item) => item.id === role.id ? { ...item, name: e.target.value as RoleName } : item))}
                                          style={{ minWidth: 160 }}
                                        />
                                      </td>
                                      <td>
                                        <div className="table-actions" style={{ gap: 8, maxWidth: 420, flexWrap: 'wrap' }}>
                                          {modules.map((module) => (
                                            <label key={`${role.id}-${module}`} className="checkbox-field" style={{ minHeight: 40, padding: '0 10px' }}>
                                              <input type="checkbox" checked={Boolean(state[module])} onChange={() => handleRolePermissionToggle(role.id, module)} />
                                              <span>{module}</span>
                                            </label>
                                          ))}
                                        </div>
                                      </td>
                                      <td>
                                        <button type="button" className="primary-button small" onClick={(event) => void saveRoleSetting({ ...role, name: role.name }, event.currentTarget)}>Guardar</button>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}

                    {maintenanceSection === 'cotizaciones' ? (
                      <div className="maintenance-section-panel">
                        <div className="card-head module-head">
                          <h3>Edición de cotizaciones</h3>
                        </div>
                        <div className="quote-table-wrap">
                          <table>
                            <thead>
                              <tr>
                                <th>Nombre</th>
                                <th>Cliente</th>
                                <th>País</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {quotes.map((quote) => (
                                <tr key={quote.id}>
                                  <td>{quote.title}</td>
                                  <td>{quote.client?.name ?? '—'}</td>
                                  <td>{quote.country?.name ?? '—'}</td>
                                  <td><span className={`status ${formatStatusClass(quote.status)}`}>{quote.status}</span></td>
                                  <td>
                                    <div className="table-actions">
                                      <button type="button" className="text-button" onClick={() => handleOpenQuoteModal(quote)}>Abrir</button>
                                      <button type="button" className="text-button" onClick={() => handleDuplicateQuote(quote.id)}>Duplicar</button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}

                    {maintenanceSection === 'paises' ? (
                      <div className="maintenance-section-panel">
                        <div className="card-head module-head">
                          <h3>Países</h3>
                        </div>
                        <div className="mini-form-grid">
                          <label className="field">
                            <span>Nombre</span>
                            <input value={countryDraft.name} onChange={(e) => setCountryDraft((current) => ({ ...current, name: e.target.value }))} />
                          </label>
                          <label className="field">
                            <span>ISO 2</span>
                            <input value={countryDraft.iso2} maxLength={2} onChange={(e) => setCountryDraft((current) => ({ ...current, iso2: e.target.value }))} />
                          </label>
                          <label className="field">
                            <span>ISO 3</span>
                            <input value={countryDraft.iso3} maxLength={3} onChange={(e) => setCountryDraft((current) => ({ ...current, iso3: e.target.value }))} />
                          </label>
                          <label className="field">
                            <span>Moneda</span>
                            <select value={countryDraft.currencyId} onChange={(e) => setCountryDraft((current) => ({ ...current, currencyId: e.target.value }))}>
                              <option value="">Selecciona</option>
                              {currencies.map((currency) => (
                                <option key={currency.id} value={currency.id}>{currency.name} ({currency.code})</option>
                              ))}
                            </select>
                          </label>
                          <label className="field checkbox-field">
                            <input type="checkbox" checked={countryDraft.isDefault} onChange={(e) => setCountryDraft((current) => ({ ...current, isDefault: e.target.checked }))} />
                            <span>País base</span>
                          </label>
                        </div>
                        <button type="button" className="primary-button small" onClick={(event) => void createCountryRecord(event.currentTarget)}>Guardar país</button>
                        <div className="inline-record-list">
                          {countries.map((country) => (
                            <div key={country.id} className="inline-record-row">
                              <span>{country.name}</span>
                              <small>{country.iso3}</small>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {maintenanceSection === 'parametros' ? (
                      <div className="maintenance-section-panel">
                        <div className="card-head module-head">
                          <h3>Parámetros por país</h3>
                        </div>
                        <div className="quote-form-grid">
                          <label className="field">
                            <span>País</span>
                            <select value={selectedMaintenanceCountryId} onChange={(e) => setSelectedMaintenanceCountryId(e.target.value)}>
                              <option value="">Selecciona país</option>
                              {countries.map((country) => (
                                <option key={country.id} value={country.id}>{country.name}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <div className="mini-form-grid">
                          <label className="field">
                            <span>Ratio incremento pago</span>
                            <input type="number" step="0.01" value={countrySettingDraft.paymentIncreaseRatio} onChange={(e) => setCountrySettingDraft((current) => ({ ...current, paymentIncreaseRatio: e.target.value }))} />
                          </label>
                          <label className="field">
                            <span>Ratio descuento día reducido</span>
                            <input type="number" step="0.01" value={countrySettingDraft.reducedDayDiscountRatio} onChange={(e) => setCountrySettingDraft((current) => ({ ...current, reducedDayDiscountRatio: e.target.value }))} />
                          </label>
                          <label className="field">
                            <span>Tasa de cambio</span>
                            <input type="number" step="0.01" value={countrySettingDraft.exchangeRate} onChange={(e) => setCountrySettingDraft((current) => ({ ...current, exchangeRate: e.target.value }))} />
                          </label>
                          <label className="field">
                            <span>Salario referente día</span>
                            <input type="number" step="0.01" value={countrySettingDraft.referenceDailySalaryLocal} onChange={(e) => setCountrySettingDraft((current) => ({ ...current, referenceDailySalaryLocal: e.target.value }))} />
                          </label>
                          <label className="field">
                            <span>Salario referencia USD</span>
                            <input type="number" step="0.01" value={countrySettingDraft.referenceDailySalaryUsd} onChange={(e) => setCountrySettingDraft((current) => ({ ...current, referenceDailySalaryUsd: e.target.value }))} />
                          </label>
                          <label className="field">
                            <span>Código moneda</span>
                            <input value={countrySettingDraft.currencyCode} onChange={(e) => setCountrySettingDraft((current) => ({ ...current, currencyCode: e.target.value }))} />
                          </label>
                        </div>

                        <div className="mini-form-grid">
                          <label className="field">
                            <span>Salario referente día (calculado)</span>
                            <input value={salaryPreview.referenceSalaryPerDay.toFixed(2)} readOnly />
                          </label>
                          <label className="field">
                            <span>Salario reducido día (calculado)</span>
                            <input value={salaryPreview.reducedSalaryPerDay.toFixed(2)} readOnly />
                          </label>
                        </div>

                        <button type="button" className="primary-button small" onClick={(event) => void saveCountrySettingRecord(event.currentTarget)}>Guardar parámetros</button>
                        <div className="inline-record-list">
                          {countryCalculationSettings.filter((setting) => Number(setting.countryId) === Number(selectedMaintenanceCountryId || 0)).map((setting) => (
                            <div key={setting.id} className="inline-record-row">
                              <span>{countries.find((country) => country.id === Number(setting.countryId))?.name ?? 'País'}</span>
                              <small>{setting.isConfigured ? 'Configurado' : 'Incompleto'}</small>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {maintenanceSection === 'incentivos' ? (
                      <div className="maintenance-section-panel">
                        <div className="card-head module-head">
                          <h3>Incentivos</h3>
                        </div>
                        <div className="mini-form-grid">
                          <label className="field">
                            <span>País</span>
                            <select value={countryIncentiveDraft.countryId || selectedMaintenanceCountryId} onChange={(e) => setCountryIncentiveDraft((current) => ({ ...current, countryId: e.target.value }))}>
                              <option value="">Selecciona país</option>
                              {countries.map((country) => (
                                <option key={country.id} value={country.id}>{country.name}</option>
                              ))}
                            </select>
                          </label>
                          <label className="field">
                            <span>Tipo</span>
                            <select value={countryIncentiveDraft.type} onChange={(e) => setCountryIncentiveDraft((current) => ({ ...current, type: e.target.value as 'PILOTO' | 'EVALUACION' }))}>
                              <option value="PILOTO">PILOTO</option>
                              <option value="EVALUACION">EVALUACION</option>
                            </select>
                          </label>
                          <label className="field">
                            <span>Valor unitario USD</span>
                            <input type="number" step="0.01" value={countryIncentiveDraft.unitValueUsd} onChange={(e) => setCountryIncentiveDraft((current) => ({ ...current, unitValueUsd: e.target.value }))} />
                          </label>
                          <label className="field">
                            <span>Moneda</span>
                            <input value={countryIncentiveDraft.currencyCode} onChange={(e) => setCountryIncentiveDraft((current) => ({ ...current, currencyCode: e.target.value }))} />
                          </label>
                        </div>
                        <button type="button" className="primary-button small" onClick={(event) => void saveCountryIncentiveRecord(event.currentTarget)}>Guardar incentivo</button>
                        <div className="inline-record-list">
                          {countryIncentives.filter((item) => Number(item.countryId) === Number(countryIncentiveDraft.countryId || selectedMaintenanceCountryId || 0)).map((item) => (
                            <div key={item.id} className="inline-record-row">
                              <span>{item.type}</span>
                              <small>{Number(item.unitValueUsd).toFixed(2)} {item.currencyCode ?? 'USD'}</small>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {maintenanceSection === 'planTrabajo' ? (
                      <div className="maintenance-section-panel">
                        <div className="card-head module-head">
                          <h3>Plan de trabajo</h3>
                        </div>
                        <div className="mini-form-grid">
                          <label className="field">
                            <span>País</span>
                            <select value={workPlanDraft.countryId || selectedMaintenanceCountryId} onChange={(e) => setWorkPlanDraft((current) => ({ ...current, countryId: e.target.value }))}>
                              <option value="">Selecciona país</option>
                              {countries.map((country) => (
                                <option key={country.id} value={country.id}>{country.name}</option>
                              ))}
                            </select>
                          </label>
                          <label className="field">
                            <span>Fase</span>
                            <select value={workPlanDraft.phaseId} onChange={(e) => setWorkPlanDraft((current) => ({ ...current, phaseId: e.target.value }))}>
                              <option value="">Selecciona</option>
                              {phases.map((phase) => (
                                <option key={phase.id} value={phase.id}>{phase.name}</option>
                              ))}
                            </select>
                          </label>
                          <label className="field">
                            <span>Rol ID</span>
                            <input type="number" value={workPlanDraft.roleId} onChange={(e) => setWorkPlanDraft((current) => ({ ...current, roleId: e.target.value }))} />
                          </label>
                          <label className="field">
                            <span>Cantidad</span>
                            <input type="number" step="1" value={workPlanDraft.quantity} onChange={(e) => setWorkPlanDraft((current) => ({ ...current, quantity: e.target.value }))} />
                          </label>
                        </div>
                        <button type="button" className="primary-button small" onClick={(event) => void saveWorkPlanAssignment(event.currentTarget)}>Guardar plan</button>
                        <div className="inline-record-list">
                          {workPlanAssignments.filter((item) => Number(item.countryId) === Number(workPlanDraft.countryId || selectedMaintenanceCountryId || 0)).map((item) => (
                            <div key={item.id} className="inline-record-row">
                              <span>{phases.find((phase) => phase.id === Number(item.phaseId))?.name ?? 'Fase'}</span>
                              <small>Rol {item.roleId} · {item.quantity}</small>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {maintenanceSection === 'equipos' ? (
                      <div className="maintenance-section-panel">
                        <div className="card-head module-head">
                          <h3>Equipos por fase</h3>
                        </div>
                        <div className="mini-form-grid">
                          <label className="field">
                            <span>País</span>
                            <select value={teamConfigurationDraft.countryId || selectedMaintenanceCountryId} onChange={(e) => setTeamConfigurationDraft((current) => ({ ...current, countryId: e.target.value }))}>
                              <option value="">Selecciona país</option>
                              {countries.map((country) => (
                                <option key={country.id} value={country.id}>{country.name}</option>
                              ))}
                            </select>
                          </label>
                          <label className="field">
                            <span>Fase</span>
                            <select value={teamConfigurationDraft.phaseId} onChange={(e) => setTeamConfigurationDraft((current) => ({ ...current, phaseId: e.target.value }))}>
                              <option value="">Selecciona</option>
                              {phases.map((phase) => (
                                <option key={phase.id} value={phase.id}>{phase.name}</option>
                              ))}
                            </select>
                          </label>
                          <label className="field">
                            <span>Tipo</span>
                            <select value={teamConfigurationDraft.teamType} onChange={(e) => setTeamConfigurationDraft((current) => ({ ...current, teamType: e.target.value as 'LOCAL' | 'FOREIGN' }))}>
                              <option value="LOCAL">LOCAL</option>
                              <option value="FOREIGN">FOREIGN</option>
                            </select>
                          </label>
                        </div>
                        <button type="button" className="primary-button small" onClick={(event) => void saveTeamConfiguration(event.currentTarget)}>Guardar equipo</button>
                        <div className="inline-record-list">
                          {teamConfigurations.filter((item) => Number(item.countryId) === Number(teamConfigurationDraft.countryId || selectedMaintenanceCountryId || 0)).map((item) => (
                            <div key={item.id} className="inline-record-row">
                              <span>{phases.find((phase) => phase.id === Number(item.phaseId))?.name ?? 'Fase'}</span>
                              <small>{item.teamType}</small>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {maintenanceSection === 'clientes' ? (
                      <div className="maintenance-section-panel">
                        <div className="card-head module-head">
                          <h3>Clientes</h3>
                        </div>
                        <div className="mini-form-grid">
                          <label className="field">
                            <span>País</span>
                            <select value={clientDraft.countryId} onChange={(e) => setClientDraft((current) => ({ ...current, countryId: e.target.value }))}>
                              <option value="">Selecciona</option>
                              {countries.map((country) => (
                                <option key={country.id} value={country.id}>{country.name}</option>
                              ))}
                            </select>
                          </label>
                          <label className="field">
                            <span>Nombre</span>
                            <input value={clientDraft.name} onChange={(e) => setClientDraft((current) => ({ ...current, name: e.target.value }))} />
                          </label>
                          <label className="field">
                            <span>Legal</span>
                            <input value={clientDraft.legalName} onChange={(e) => setClientDraft((current) => ({ ...current, legalName: e.target.value }))} />
                          </label>
                          <label className="field">
                            <span>RUC / NIT</span>
                            <input value={clientDraft.taxId} onChange={(e) => setClientDraft((current) => ({ ...current, taxId: e.target.value }))} />
                          </label>
                          <label className="field">
                            <span>Contacto</span>
                            <input value={clientDraft.contactName} onChange={(e) => setClientDraft((current) => ({ ...current, contactName: e.target.value }))} />
                          </label>
                          <label className="field">
                            <span>Email</span>
                            <input type="email" value={clientDraft.email} onChange={(e) => setClientDraft((current) => ({ ...current, email: e.target.value }))} />
                          </label>
                          <label className="field">
                            <span>Teléfono</span>
                            <input value={clientDraft.phone} onChange={(e) => setClientDraft((current) => ({ ...current, phone: e.target.value }))} />
                          </label>
                          <label className="field wide">
                            <span>Dirección</span>
                            <input value={clientDraft.address} onChange={(e) => setClientDraft((current) => ({ ...current, address: e.target.value }))} />
                          </label>
                        </div>
                        <button type="button" className="primary-button small" onClick={(event) => void createClientRecord(event.currentTarget)}>Guardar cliente</button>
                        <div className="inline-record-list">
                          {clients.map((client) => (
                            <div key={client.id} className="inline-record-row">
                              <span>{client.name}</span>
                              <small>{client.countryId ? countries.find((country) => country.id === client.countryId)?.name ?? 'Sin país' : 'Sin país'}</small>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {maintenanceSection === 'fases' ? (
                      <div className="maintenance-section-panel">
                        <div className="card-head module-head">
                          <h3>Fases</h3>
                        </div>
                        <div className="mini-form-grid">
                          <label className="field">
                            <span>Nombre</span>
                            <input value={phaseDraft.name} onChange={(e) => setPhaseDraft((current) => ({ ...current, name: e.target.value }))} />
                          </label>
                          <label className="field">
                            <span>Código</span>
                            <input value={phaseDraft.code} onChange={(e) => setPhaseDraft((current) => ({ ...current, code: e.target.value }))} />
                          </label>
                          <label className="field">
                            <span>Orden</span>
                            <input type="number" value={phaseDraft.sortOrder} onChange={(e) => setPhaseDraft((current) => ({ ...current, sortOrder: e.target.value }))} />
                          </label>
                        </div>
                        <button type="button" className="primary-button small" onClick={(event) => void createPhaseRecord(event.currentTarget)}>Guardar fase</button>
                        <div className="inline-record-list">
                          {phases.map((phase) => (
                            <div key={phase.id} className="inline-record-row">
                              <span>{phase.name}</span>
                              <small>{phase.code}</small>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {maintenanceSection === 'conceptos' ? (
                      <div className="maintenance-section-panel">
                        <div className="card-head module-head">
                          <h3>Conceptos / catálogo</h3>
                        </div>
                        <div className="mini-form-grid">
                          <label className="field">
                            <span>Categoría</span>
                            <select value={catalogDraft.categoryId} onChange={(e) => setCatalogDraft((current) => ({ ...current, categoryId: e.target.value }))}>
                              <option value="">Selecciona</option>
                              {costCategories.map((category) => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                              ))}
                            </select>
                          </label>
                          <label className="field">
                            <span>Código</span>
                            <input value={catalogDraft.code} onChange={(e) => setCatalogDraft((current) => ({ ...current, code: e.target.value }))} />
                          </label>
                          <label className="field">
                            <span>Nombre</span>
                            <input value={catalogDraft.name} onChange={(e) => setCatalogDraft((current) => ({ ...current, name: e.target.value }))} />
                          </label>
                          <label className="field">
                            <span>Unidad</span>
                            <input value={catalogDraft.unitLabel} onChange={(e) => setCatalogDraft((current) => ({ ...current, unitLabel: e.target.value }))} />
                          </label>
                        </div>
                        <button type="button" className="primary-button small" onClick={(event) => void createCatalogItemRecord(event.currentTarget)}>Guardar concepto</button>
                        <div className="inline-record-list">
                          {catalogItems.map((item) => (
                            <div key={item.id} className="inline-record-row">
                              <span>{item.name}</span>
                              <small>{item.code}</small>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {maintenanceSection === 'precios' ? (
                      <div className="maintenance-section-panel">
                        <div className="card-head module-head">
                          <h3>Precios por país</h3>
                        </div>
                        <div className="quote-form-grid">
                          <label className="field">
                            <span>País</span>
                            <select value={selectedMaintenanceCountryId} onChange={(e) => setSelectedMaintenanceCountryId(e.target.value)}>
                              <option value="">Selecciona país</option>
                              {countries.map((country) => (
                                <option key={country.id} value={country.id}>{country.name}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                        {selectedMaintenanceCountryId ? (
                          <div className="excel-table-wrap">
                            <table className="excel-table">
                              <thead>
                                <tr>
                                  <th>Fase</th>
                                  <th>Concepto</th>
                                  <th>Precio USD</th>
                                  <th>Guardar</th>
                                </tr>
                              </thead>
                              <tbody>
                                {maintenanceRows.length === 0 ? (
                                  <tr><td colSpan={4}>No hay conceptos asociados a este país.</td></tr>
                                ) : (
                                  maintenanceRows.map((row) => (
                                    <tr key={row.phaseItemId}>
                                      <td>{row.phaseName}</td>
                                      <td>{row.catalogName}</td>
                                      <td>
                                        <div className="currency-input-wrap">
                                          <span className="currency-prefix">$</span>
                                          <input type="number" min="0" step="0.01" value={priceDrafts[row.phaseItemId] ?? row.unitPriceUsd} onChange={(event) => {
                                            const value = Number(event.target.value || 0);
                                            setPriceDrafts((current) => ({ ...current, [row.phaseItemId]: value }));
                                          }} />
                                          <span className="currency-suffix">({getCountryCodeById(selectedMaintenanceCountryId)})</span>
                                        </div>
                                      </td>
                                      <td><button type="button" className="primary-button small" onClick={(event) => void handleSavePrice(row, event.currentTarget)}>Guardar</button></td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {maintenanceSection === 'tiposCambio' ? (
                      <div className="maintenance-section-panel">
                        <div className="card-head module-head">
                          <h3>Tipos de cambio</h3>
                        </div>
                        <div className="inline-record-list">
                          {exchangeRates.map((rate) => (
                            <div key={rate.id} className="inline-record-row">
                              <span>{countries.find((country) => country.id === rate.countryId)?.name ?? 'País'}</span>
                              <small>{Number(rate.rate).toFixed(4)}</small>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {maintenanceSection === 'reglas' ? (
                      <div className="maintenance-section-panel">
                        <div className="card-head module-head">
                          <h3>Fórmulas y reglas</h3>
                        </div>
                        <div className="mini-form-grid">
                          <label className="field">
                            <span>Código</span>
                            <input value={ruleDraft.code} onChange={(e) => setRuleDraft((current) => ({ ...current, code: e.target.value }))} />
                          </label>
                          <label className="field">
                            <span>Nombre</span>
                            <input value={ruleDraft.name} onChange={(e) => setRuleDraft((current) => ({ ...current, name: e.target.value }))} />
                          </label>
                          <label className="field">
                            <span>Tipo</span>
                            <select value={ruleDraft.ruleType} onChange={(e) => setRuleDraft((current) => ({ ...current, ruleType: e.target.value }))}>
                              <option value="LINE_TOTAL">LINE_TOTAL</option>
                              <option value="CEIL_RATIO">CEIL_RATIO</option>
                              <option value="PERCENT_OF_DAYS">PERCENT_OF_DAYS</option>
                              <option value="UNIT_COST_DELTA">UNIT_COST_DELTA</option>
                              <option value="REFERENCE_SALARY">REFERENCE_SALARY</option>
                              <option value="INTERNAL_COST_NORMALIZED">INTERNAL_COST_NORMALIZED</option>
                              <option value="SAMPLE_SIZING">SAMPLE_SIZING</option>
                              <option value="PROPORTIONAL_DATA_COST">PROPORTIONAL_DATA_COST</option>
                              <option value="EXPECTED_MARGIN">EXPECTED_MARGIN</option>
                            </select>
                          </label>
                          <label className="field wide">
                            <span>Params JSON</span>
                            <textarea rows={4} value={ruleDraft.paramsJson} onChange={(e) => setRuleDraft((current) => ({ ...current, paramsJson: e.target.value }))} />
                          </label>
                        </div>
                        <button type="button" className="primary-button small" onClick={(event) => void createRuleRecord(event.currentTarget)}>Guardar regla</button>
                        <div className="inline-record-list">
                          {calculationRules.map((rule) => (
                            <div key={rule.id} className="inline-record-row">
                              <span>{rule.name}</span>
                              <small>{rule.ruleType}</small>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>
            ) : null}

            {canAccessModule('Cotizaciones') && selectedModule === 'Cotizaciones' ? (
              <section className="quote-module-container">
                <div className="card-head module-head">
                  <h3>Gestión de cotizaciones</h3>
                  <button type="button" className="primary-button small" onClick={() => setShowQuoteForm((value) => !value)}>
                    {showQuoteForm ? 'Cerrar' : 'Nueva cotización'}
                  </button>
                </div>

                {error ? <div className="error-box">{error}</div> : null}

                {showQuoteForm ? (
                  <form className="quote-form" onSubmit={handleCreateQuote}>
                    <div className="quote-form-grid">
                      <label className="field">
                        <span>Título</span>
                        <input
                          value={quoteForm.title}
                          onChange={(e) => setQuoteForm((current) => ({ ...current, title: e.target.value }))}
                          placeholder="Ej. Piloto retail Guatemala"
                          required
                        />
                      </label>

                      <div className="field client-select-field">
                        <span>Cliente</span>
                        <div className="client-select-row">
                          <select
                            value={quoteForm.clientId}
                            onChange={(e) => setQuoteForm((current) => ({ ...current, clientId: e.target.value }))}
                            required
                          >
                            <option value="">Selecciona</option>
                            {clients.map((client) => (
                              <option key={client.id} value={client.id}>{client.name}</option>
                            ))}
                          </select>
                          <button type="button" className="ghost-button small-inline" onClick={() => setShowNewClientForm((value) => !value)}>
                            {showNewClientForm ? 'Cerrar' : 'Nuevo cliente'}
                          </button>
                        </div>
                        {showNewClientForm ? (
                          <div className="mini-form-grid client-inline-form">
                            <label className="field">
                              <span>País</span>
                              <select value={newClientDraft.countryId} onChange={(e) => setNewClientDraft((current) => ({ ...current, countryId: e.target.value }))}>
                                <option value="">Selecciona</option>
                                {countries.map((country) => (
                                  <option key={country.id} value={country.id}>{country.name}</option>
                                ))}
                              </select>
                            </label>
                            <label className="field">
                              <span>Nombre</span>
                              <input value={newClientDraft.name} onChange={(e) => setNewClientDraft((current) => ({ ...current, name: e.target.value }))} />
                            </label>
                            <label className="field">
                              <span>Contacto</span>
                              <input value={newClientDraft.contactName} onChange={(e) => setNewClientDraft((current) => ({ ...current, contactName: e.target.value }))} />
                            </label>
                            <label className="field">
                              <span>Email</span>
                              <input type="email" value={newClientDraft.email} onChange={(e) => setNewClientDraft((current) => ({ ...current, email: e.target.value }))} />
                            </label>
                            <button type="button" className="primary-button small" onClick={(event) => void handleCreateClientFromQuote(event.currentTarget)}>Guardar cliente</button>
                          </div>
                        ) : null}
                      </div>

                      <label className="field">
                        <span>País</span>
                        <select
                          value={quoteForm.countryId}
                          onChange={(e) => setQuoteForm((current) => ({ ...current, countryId: e.target.value }))}
                          required
                        >
                          <option value="">Selecciona</option>
                          {countries.map((country) => (
                            <option key={country.id} value={country.id}>{country.name}</option>
                          ))}
                        </select>
                      </label>

                      <label className="field">
                        <span>Muestra</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={quoteForm.sampleSize}
                          onChange={(e) => setQuoteForm((current) => ({ ...current, sampleSize: e.target.value }))}
                        />
                      </label>

                      <label className="field">
                        <span>Válida hasta</span>
                        <input
                          type="date"
                          value={quoteForm.validUntil}
                          onChange={(e) => setQuoteForm((current) => ({ ...current, validUntil: e.target.value }))}
                        />
                      </label>
                    </div>

                    <label className="field">
                      <span>Descripción</span>
                      <textarea
                        rows={4}
                        value={quoteForm.description}
                        onChange={(e) => setQuoteForm((current) => ({ ...current, description: e.target.value }))}
                        placeholder="Describe el alcance y objetivo del proyecto"
                      />
                    </label>

                    <div className="phase-builder">
                      <div className="phase-builder-header">
                        <h4>Fases del Excel</h4>
                        <button
                          type="button"
                          className="ghost-button small-inline"
                          onClick={() => {
                            if (selectedPhaseIds.length === phases.length) {
                              setSelectedPhaseIds([]);
                              return;
                            }
                            setSelectedPhaseIds(phases.map((phase) => phase.id));
                          }}
                        >
                          {selectedPhaseIds.length === phases.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                        </button>
                      </div>

                      {phases.map((phase) => {
                        const phaseItemsForPhase = phaseItems.filter((entry) => entry.phaseId === phase.id);
                        const rows = quotePhaseDrafts[phase.id] ?? phaseItemsForPhase.map((entry) => ({
                          catalogItemId: entry.catalogItemId,
                          quantity: 1,
                          days: 1,
                        }));

                        const isSelected = selectedPhaseIds.includes(phase.id);
                        const totalRows = rows.length;

                        return (
                          <div key={phase.id} className={`phase-card ${isSelected ? 'selected' : 'unselected'}`}>
                            <div className="phase-card-header">
                              <div className="phase-toggle">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    setSelectedPhaseIds((current) =>
                                      current.includes(phase.id)
                                        ? current.filter((id) => id !== phase.id)
                                        : [...current, phase.id]
                                    );
                                  }}
                                />
                                <strong>{phase.name}</strong>
                              </div>
                              <span>{totalRows} conceptos</span>
                            </div>

                            {isSelected ? (
                              <div className="excel-table-wrap">
                                <table className="excel-table">
                                  <thead>
                                    <tr>
                                      <th>Concepto</th>
                                      <th>Cantidad de personas</th>
                                      <th>Días trabajados</th>
                                      <th>Costo unitario</th>
                                      <th>Costo total</th>
                                      <th>Costo en moneda local</th>
                                      <th>Costo según</th>
                                      <th>Costo local</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {rows.map((row, index) => {
                                      const catalogItem = catalogItems.find((item) => item.id === row.catalogItemId);
                                      if (!catalogItem) return null;

                                      const unitPrice = getUnitPriceForPhaseRow(phase.id, row.catalogItemId);
                                      const quantity = Number(row.quantity || 0);
                                      const days = Number(row.days || 0);
                                      const totalUsd = quantity * days * unitPrice;
                                      const exchangeRate = getSelectedExchangeRate();
                                      const totalLocal = totalUsd * exchangeRate;

                                      const countrySetting = countryCalculationSettings.find((setting) => Number(setting.countryId) === Number(quoteForm.countryId || selectedMaintenanceCountryId || 0));
                                      const incrementRatioPercent = normalizeRatioPercent(Number(countrySetting?.paymentIncreaseRatio ?? 0));
                                      const reductionRatioPercent = normalizeRatioPercent(Number(countrySetting?.reducedDayDiscountRatio ?? 0));
                                      const exchangeRateValue = Number(countrySetting?.exchangeRate ?? exchangeRate ?? 0);
                                      const workingDaysPerMonth = 26.8;
                                      const reducedSalaryPerDay = exchangeRateValue > 0 ? (690 * (1 + incrementRatioPercent - reductionRatioPercent) * exchangeRateValue) / workingDaysPerMonth : 0;
                                      const phaseBaseUnitPrice = (rows
                                        .map((phaseRow) => getUnitPriceForPhaseRow(phase.id, phaseRow.catalogItemId))
                                        .find((value) => Number(value) > 0) ?? 0);
                                      const internalCost = phaseBaseUnitPrice > 0 ? quantity * days * (unitPrice / phaseBaseUnitPrice) * reducedSalaryPerDay : 0;

                                      const currentCategory = getCatalogCategoryLabel(catalogItem);
                                      const previousCategory = index > 0
                                        ? getCatalogCategoryLabel(catalogItems.find((item) => item.id === rows[index - 1].catalogItemId))
                                        : null;
                                      const shouldShowCategory = previousCategory !== currentCategory;

                                      return (
                                        <Fragment key={`${phase.id}-${catalogItem.id}`}>
                                          {shouldShowCategory ? (
                                            <tr className="category-row">
                                              <td colSpan={8}>{currentCategory}</td>
                                            </tr>
                                          ) : null}
                                          <tr>
                                            <td>{catalogItem.name}</td>
                                            <td>
                                              <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={row.quantity}
                                                onChange={(event) => {
                                                  const value = Number(event.target.value || 0);
                                                  setQuotePhaseDrafts((current) => ({
                                                    ...current,
                                                    [phase.id]: (current[phase.id] ?? rows).map((item, itemIndex) =>
                                                      itemIndex === index ? { ...item, quantity: value } : item
                                                    ),
                                                  }));
                                                }}
                                              />
                                            </td>
                                            <td>
                                              <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={row.days}
                                                onChange={(event) => {
                                                  const value = Number(event.target.value || 0);
                                                  setQuotePhaseDrafts((current) => ({
                                                    ...current,
                                                    [phase.id]: (current[phase.id] ?? rows).map((item, itemIndex) =>
                                                      itemIndex === index ? { ...item, days: value } : item
                                                    ),
                                                  }));
                                                }}
                                              />
                                            </td>
                                            <td>{formatCurrency(unitPrice, quoteForm.countryId || selectedMaintenanceCountryId || undefined)}</td>
                                            <td>{formatCurrency(totalUsd, quoteForm.countryId || selectedMaintenanceCountryId || undefined)}</td>
                                            <td>{formatCurrency(totalLocal, quoteForm.countryId || selectedMaintenanceCountryId || undefined)}</td>
                                            <td>{formatCurrency(internalCost, quoteForm.countryId || selectedMaintenanceCountryId || undefined)}</td>
                                            <td>{formatCurrency(totalLocal, quoteForm.countryId || selectedMaintenanceCountryId || undefined)}</td>
                                          </tr>
                                        </Fragment>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>

                    <div className="quote-form-actions">
                      <button type="submit" className="primary-button small" disabled={creatingQuote}>
                        {creatingQuote ? 'Creando...' : 'Guardar cotización'}
                      </button>
                    </div>
                  </form>
                ) : null}

                <div className="quote-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Cliente</th>
                        <th>País</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotesLoading ? (
                        <tr>
                          <td colSpan={5}>Cargando cotizaciones...</td>
                        </tr>
                      ) : quotes.length === 0 ? (
                        <tr>
                          <td colSpan={5}>Aún no hay cotizaciones registradas.</td>
                        </tr>
                      ) : (
                        quotes.map((quote) => {
                          const isBlocked = quote.status === 'RECHAZADA' || quote.status === 'CANCELADA';
                          const isApproved = quote.status === 'APROBADA';

                          return (
                            <tr key={quote.id}>
                              <td>{quote.title}</td>
                              <td>{quote.client?.name ?? '—'}</td>
                              <td>{quote.country?.name ?? '—'}</td>
                              <td>
                                <div className="status-cell">
                                  <span className={`status ${formatStatusClass(quote.status)} ${isApproved ? 'approved' : ''} ${isBlocked ? 'blocked' : ''}`}>
                                    {quote.status}
                                  </span>
                                  <select
                                    className="status-select"
                                    value={quote.status}
                                    onChange={(e) => handleStatusChange(quote.id, e.target.value)}
                                    disabled={isBlocked}
                                    title={isBlocked ? 'Esta cotización está bloqueada' : 'Cambiar estado'}
                                  >
                                    {statusOptions.map((status) => (
                                      <option key={status} value={status}>{status}</option>
                                    ))}
                                  </select>
                                </div>
                              </td>
                              <td>
                                <div className="table-actions">
                                  <button type="button" className="text-button" onClick={() => handleOpenQuoteModal(quote)}>
                                    Gestionar
                                  </button>
                                  <button type="button" className="text-button" onClick={() => handleDuplicateQuote(quote.id)}>
                                    Duplicar
                                  </button>
                                  <button type="button" className="text-button danger" onClick={() => handleDeleteQuote(quote.id)}>
                                    Eliminar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {selectedQuote && quoteEditor ? (
                  <div className="modal-backdrop" onClick={() => { setSelectedQuote(null); setQuoteEditor(null); setQuoteDetail(null); }}>
                    <div className="quote-modal-shell" onClick={(event) => event.stopPropagation()}>
                      <div className="quote-modal-header">
                        <div className="quote-modal-title-wrap">
                          <span className="chip neutral">{selectedQuote.quoteNumber || `COT-${selectedQuote.id}`}</span>
                          <h3>{quoteEditor.title || selectedQuote.title}</h3>
                        </div>

                        <div className="quote-modal-header-actions">
                          <span className={`status ${formatStatusClass(quoteEditor.status)} ${quoteEditor.status === 'APROBADA' ? 'approved' : ''} ${quoteEditor.status === 'RECHAZADA' || quoteEditor.status === 'CANCELADA' ? 'blocked' : ''}`}>
                            {quoteEditor.status}
                          </span>
                          <button type="button" className="ghost-button small-inline" onClick={() => { setSelectedQuote(null); setQuoteEditor(null); setQuoteDetail(null); }}>
                            Cerrar
                          </button>
                        </div>
                      </div>

                      <div className="quote-modal-body">
                        <section className="modal-panel">
                          <div className="panel-title">Información general</div>

                          <div className="modal-form-grid">
                            <label className="field">
                              <span>Título</span>
                              <input
                                value={quoteEditor.title}
                                onChange={(event) => setQuoteEditor((current) => current ? { ...current, title: event.target.value } : current)}
                              />
                            </label>

                            <label className="field">
                              <span>Estado</span>
                              <select
                                value={quoteEditor.status}
                                onChange={(event) => setQuoteEditor((current) => current ? { ...current, status: event.target.value } : current)}
                              >
                                {statusOptions.map((status) => (
                                  <option key={status} value={status}>{status}</option>
                                ))}
                              </select>
                            </label>

                            <label className="field">
                              <span>Cliente</span>
                              <select
                                value={quoteEditor.clientId}
                                onChange={(event) => setQuoteEditor((current) => current ? { ...current, clientId: event.target.value } : current)}
                              >
                                <option value="">Selecciona</option>
                                {clients.map((client) => (
                                  <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                              </select>
                            </label>

                            <label className="field">
                              <span>País</span>
                              <select
                                value={quoteEditor.countryId}
                                onChange={(event) => setQuoteEditor((current) => current ? { ...current, countryId: event.target.value } : current)}
                              >
                                <option value="">Selecciona</option>
                                {countries.map((country) => (
                                  <option key={country.id} value={country.id}>{country.name}</option>
                                ))}
                              </select>
                            </label>

                            <label className="field">
                              <span>Muestra</span>
                              <input
                                type="number"
                                value={quoteEditor.sampleSize}
                                onChange={(event) => setQuoteEditor((current) => current ? { ...current, sampleSize: event.target.value } : current)}
                              />
                            </label>

                            <label className="field">
                              <span>Válida hasta</span>
                              <input
                                type="date"
                                value={quoteEditor.validUntil}
                                onChange={(event) => setQuoteEditor((current) => current ? { ...current, validUntil: event.target.value } : current)}
                              />
                            </label>
                          </div>

                          <label className="field">
                            <span>Descripción</span>
                            <textarea
                              rows={6}
                              value={quoteEditor.description}
                              onChange={(event) => setQuoteEditor((current) => current ? { ...current, description: event.target.value } : current)}
                            />
                          </label>
                        </section>

                        <section className="modal-panel">
                          <div className="panel-title">Detalle de cotización</div>

                          {quoteDetail && (quoteDetail.phases ?? []).length > 0 ? (
                            <div className="detail-phase-stack">
                              {(quoteDetail.phases ?? []).map((phase) => (
                                <div key={phase.id} className="detail-phase-card">
                                  <div className="detail-phase-header">
                                    <strong>{phase.phaseNameSnapshot}</strong>
                                    <span>{(phase.items ?? []).length} conceptos</span>
                                  </div>

                                  <div className="detail-phase-table-wrap">
                                    <table className="detail-phase-table">
                                      <thead>
                                        <tr>
                                          <th>Concepto</th>
                                          <th>Cantidad</th>
                                          <th>Días</th>
                                          <th>Unitario USD</th>
                                          <th>Total USD</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(phase.items ?? []).map((item) => {
                                          const calculatedTotal = Number(item.quantity || 0) * Number(item.days || 0) * Number(item.unitPriceUsdSnapshot || 0);
                                          return (
                                            <tr key={item.id}>
                                              <td>{item.itemNameSnapshot}</td>
                                              <td>
                                                <input
                                                  type="number"
                                                  min="0"
                                                  step="1"
                                                  value={item.quantity}
                                                  onChange={(event) => {
                                                    const value = Number(event.target.value || 0);
                                                    setQuoteDetail((current) => {
                                                      if (!current) return current;
                                                      return {
                                                        ...current,
                                                        phases: (current.phases ?? []).map((currentPhase) => currentPhase.id === phase.id ? {
                                                          ...currentPhase,
                                                          items: (currentPhase.items ?? []).map((currentItem) => currentItem.id === item.id ? { ...currentItem, quantity: value } : currentItem),
                                                        } : currentPhase),
                                                      };
                                                    });
                                                  }}
                                                />
                                              </td>
                                              <td>
                                                <input
                                                  type="number"
                                                  min="0"
                                                  step="1"
                                                  value={item.days}
                                                  onChange={(event) => {
                                                    const value = Number(event.target.value || 0);
                                                    setQuoteDetail((current) => {
                                                      if (!current) return current;
                                                      return {
                                                        ...current,
                                                        phases: (current.phases ?? []).map((currentPhase) => currentPhase.id === phase.id ? {
                                                          ...currentPhase,
                                                          items: (currentPhase.items ?? []).map((currentItem) => currentItem.id === item.id ? { ...currentItem, days: value } : currentItem),
                                                        } : currentPhase),
                                                      };
                                                    });
                                                  }}
                                                />
                                              </td>
                                              <td>{formatCurrency(Number(item.unitPriceUsdSnapshot), quoteEditor.countryId || undefined)}</td>
                                              <td>{formatCurrency(calculatedTotal, quoteEditor.countryId || undefined)}</td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>

                                  <div className="detail-phase-footer">
                                    <span>Subtotal USD</span>
                                    <strong>{formatCurrency(Number(phase.subtotalUsd), quoteEditor.countryId || undefined)}</strong>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="empty-detail">La cotización aún no tiene fases cargadas.</div>
                          )}
                        </section>
                      </div>

                      <div className="quote-modal-footer">
                        <button type="button" className="text-button danger" onClick={() => handleDeleteQuote(selectedQuote.id)}>
                          Eliminar cotización
                        </button>
                        <button type="button" className="primary-button small" onClick={(event) => void handleSaveQuoteEdition(event.currentTarget)}>
                          Guardar cambios
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
