/* eslint-disable no-console */
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import mysql from 'mysql2/promise';
import { env } from '../config/env';
import { sequelize } from '../config/database';
import '../models';
import {
  CalculationRule,
  CatalogItem,
  Client,
  CostCategory,
  Country,
  CountryItemPrice,
  Currency,
  ExchangeRate,
  Phase,
  PhaseItem,
  Role,
  User,
} from '../models';
import { hashPassword } from '../utils/password';

async function runSchema() {
  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: true,
  });
  await connection.query(schemaSql);
  await connection.end();
  console.log('✔ Esquema de base de datos creado/actualizado.');
}

async function seedRolesAndAdmin() {
  const [adminRole] = await Role.findOrCreate({ where: { name: 'ADMINISTRADOR' } });
  await Role.findOrCreate({ where: { name: 'GERENCIA' } });
  await Role.findOrCreate({ where: { name: 'EJECUTIVO' } });
  await Role.findOrCreate({ where: { name: 'OPERACIONES' } });

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const existingAdmin = await User.findOne({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const adminPassword = process.env.ADMIN_PASSWORD || crypto.randomBytes(12).toString('base64url');
    const passwordHash = await hashPassword(adminPassword);
    await User.create({ name: 'Administrador del Sistema', email: adminEmail, passwordHash, roleId: adminRole.id, active: true });
    console.log(`Usuario administrador creado: ${adminEmail} / ${adminPassword}`);
  }
}

const CURRENCIES = [
  { code: 'USD', name: 'Dólar estadounidense', symbol: '$' },
  { code: 'HNL', name: 'Lempira hondureño', symbol: 'L' },
  { code: 'GTQ', name: 'Quetzal guatemalteco', symbol: 'Q' },
  { code: 'NIO', name: 'Córdoba nicaragüense', symbol: 'C$' },
  { code: 'CRC', name: 'Colón costarricense', symbol: '₡' },
  { code: 'PAB', name: 'Balboa panameño', symbol: 'B/.' },
  { code: 'MXN', name: 'Peso mexicano', symbol: '$' },
  { code: 'DOP', name: 'Peso dominicano', symbol: 'RD$' },
  { code: 'COP', name: 'Peso colombiano', symbol: '$' },
  { code: 'VES', name: 'Bolívar venezolano', symbol: 'Bs.' },
  { code: 'PEN', name: 'Sol peruano', symbol: 'S/' },
  { code: 'BOB', name: 'Boliviano', symbol: 'Bs' },
  { code: 'CLP', name: 'Peso chileno', symbol: '$' },
  { code: 'ARS', name: 'Peso argentino', symbol: '$' },
  { code: 'PYG', name: 'Guaraní paraguayo', symbol: '₲' },
  { code: 'UYU', name: 'Peso uruguayo', symbol: '$U' },
  { code: 'BRL', name: 'Real brasileño', symbol: 'R$' },
  { code: 'CUP', name: 'Peso cubano', symbol: '$' },
  { code: 'HTG', name: 'Gourde haitiano', symbol: 'G' },
];

const COUNTRIES: Array<{ name: string; iso2: string; iso3: string; currency: string; isDefault?: boolean; rate: number }> = [
  { name: 'Honduras', iso2: 'HN', iso3: 'HND', currency: 'HNL', isDefault: true, rate: 24.7 },
  { name: 'Guatemala', iso2: 'GT', iso3: 'GTM', currency: 'GTQ', rate: 7.75 },
  { name: 'El Salvador', iso2: 'SV', iso3: 'SLV', currency: 'USD', rate: 1 },
  { name: 'Nicaragua', iso2: 'NI', iso3: 'NIC', currency: 'NIO', rate: 36.6 },
  { name: 'Costa Rica', iso2: 'CR', iso3: 'CRI', currency: 'CRC', rate: 505 },
  { name: 'Panamá', iso2: 'PA', iso3: 'PAN', currency: 'PAB', rate: 1 },
  { name: 'México', iso2: 'MX', iso3: 'MEX', currency: 'MXN', rate: 17.5 },
  { name: 'República Dominicana', iso2: 'DO', iso3: 'DOM', currency: 'DOP', rate: 59.5 },
  { name: 'Colombia', iso2: 'CO', iso3: 'COL', currency: 'COP', rate: 4100 },
  { name: 'Venezuela', iso2: 'VE', iso3: 'VEN', currency: 'VES', rate: 36.5 },
  { name: 'Perú', iso2: 'PE', iso3: 'PER', currency: 'PEN', rate: 3.75 },
  { name: 'Bolivia', iso2: 'BO', iso3: 'BOL', currency: 'BOB', rate: 6.9 },
  { name: 'Chile', iso2: 'CL', iso3: 'CHL', currency: 'CLP', rate: 950 },
  { name: 'Argentina', iso2: 'AR', iso3: 'ARG', currency: 'ARS', rate: 900 },
  { name: 'Paraguay', iso2: 'PY', iso3: 'PRY', currency: 'PYG', rate: 7300 },
  { name: 'Uruguay', iso2: 'UY', iso3: 'URY', currency: 'UYU', rate: 39 },
  { name: 'Brasil', iso2: 'BR', iso3: 'BRA', currency: 'BRL', rate: 5.1 },
  { name: 'Cuba', iso2: 'CU', iso3: 'CUB', currency: 'CUP', rate: 24 },
  { name: 'Haití', iso2: 'HT', iso3: 'HTI', currency: 'HTG', rate: 132 },
];

async function seedGeography(adminUserId: number) {
  const currencyByCode = new Map<string, Currency>();
  for (const c of CURRENCIES) {
    const [row] = await Currency.findOrCreate({ where: { code: c.code }, defaults: c });
    currencyByCode.set(c.code, row);
  }

  const usd = currencyByCode.get('USD')!;

  for (const c of COUNTRIES) {
    const currency = currencyByCode.get(c.currency)!;
    const [country] = await Country.findOrCreate({
      where: { iso3: c.iso3 },
      defaults: { name: c.name, iso2: c.iso2, iso3: c.iso3, currencyId: currency.id, isDefault: !!c.isDefault, active: true },
    });

    const hasRate = await ExchangeRate.findOne({ where: { countryId: country.id, active: true } });
    if (!hasRate) {
      await ExchangeRate.create({
        countryId: country.id,
        baseCurrencyId: usd.id,
        targetCurrencyId: currency.id,
        rate: c.rate,
        validFrom: new Date().toISOString().slice(0, 10),
        validTo: null,
        active: true,
        createdBy: adminUserId,
      });
    }

    const hasSettings = await sequelize.models.CountryCalculationSetting?.findOne({ where: { countryId: country.id } });
    if (!hasSettings) {
      await sequelize.models.CountryCalculationSetting?.create({
        countryId: country.id,
        paymentIncreaseRatio: 0.22,
        reducedDayDiscountRatio: 0.3,
        exchangeRate: c.rate,
        referenceDailySalaryLocal: 4931,
        referenceDailySalaryUsd: 31.4,
        currencyCode: currency.code,
        isConfigured: true,
        active: true,
      });
    }
  }
  console.log('✔ Países, monedas, tasas y configuración inicial por país sembrados.');
}

async function seedClient() {
  const honduras = await Country.findOne({ where: { iso3: 'HND' } });
  if (!honduras) return;
  await Client.findOrCreate({
    where: { name: 'Cliente Demo S.A.' },
    defaults: { countryId: honduras.id, name: 'Cliente Demo S.A.', legalName: 'Cliente Demo Sociedad Anónima', active: true },
  });
  console.log('✔ Cliente de demostración sembrado.');
}

const PHASES = [
  { name: 'Reclutamiento', code: 'RECLUTAMIENTO', sortOrder: 1 },
  { name: 'Piloto', code: 'PILOTO', sortOrder: 2 },
  { name: 'Previsita', code: 'PREVISITA', sortOrder: 3 },
  { name: 'Capacitación inicial', code: 'CAPACITACION_INICIAL', sortOrder: 4 },
  { name: 'Precontacto', code: 'PRECONTACTO', sortOrder: 5 },
  { name: 'Capacitación', code: 'CAPACITACION', sortOrder: 6 },
  { name: 'Mantenimiento', code: 'MANTENIMIENTO', sortOrder: 7 },
  { name: 'Levantamiento', code: 'LEVANTAMIENTO', sortOrder: 8 },
  { name: 'Revisita', code: 'REVISITA', sortOrder: 9 },
  { name: 'Materiales y otros', code: 'MATERIALES', sortOrder: 10 },
  { name: 'Datos, conexión y salas de trabajo', code: 'DATOS_CONEXION', sortOrder: 11 },
];

const CATEGORIES = [
  { name: 'Personal local', code: 'PERSONAL_LOCAL' },
  { name: 'Personal corporativo', code: 'PERSONAL_CORPORATIVO' },
  { name: 'Viáticos', code: 'VIATICOS' },
  { name: 'Materiales', code: 'MATERIALES' },
  { name: 'Servicios', code: 'SERVICIOS' },
  { name: 'Incentivos', code: 'INCENTIVOS' },
];

// code, name, categoryCode, unitLabel, precio base USD Honduras
const CATALOG_ITEMS: Array<{ code: string; name: string; category: string; unit: string; basePrice: number }> = [
  { code: 'ENCUESTADOR_LOCAL', name: 'Encuestadores - local', category: 'PERSONAL_LOCAL', unit: 'persona-día', basePrice: 24 },
  { code: 'SUPERVISOR_LOCAL', name: 'Supervisores - local', category: 'PERSONAL_LOCAL', unit: 'persona-día', basePrice: 34 },
  { code: 'SOPORTE_T2T', name: 'Soporte T2T (back-check e incentivos)', category: 'PERSONAL_LOCAL', unit: 'persona-día', basePrice: 29 },
  { code: 'COORDINADOR_LOCAL', name: 'Coordinador - local', category: 'PERSONAL_LOCAL', unit: 'persona-día', basePrice: 44 },
  { code: 'SUPERVISOR_CORP', name: 'Supervisor corporativo', category: 'PERSONAL_CORPORATIVO', unit: 'persona-día', basePrice: 75 },
  { code: 'AUDITOR_CORP', name: 'Auditores corporativo', category: 'PERSONAL_CORPORATIVO', unit: 'persona-día', basePrice: 40 },
  { code: 'COORDINADOR_CORP', name: 'Coordinador corporativo', category: 'PERSONAL_CORPORATIVO', unit: 'persona-día', basePrice: 100 },
  { code: 'DIRECTOR_CORP', name: 'Director corporativo', category: 'PERSONAL_CORPORATIVO', unit: 'persona-día', basePrice: 150 },
  { code: 'HOTEL', name: 'Hotel', category: 'VIATICOS', unit: 'noche', basePrice: 40 },
  { code: 'ALIMENTACION_FORANEA', name: 'Viáticos alimentación foránea', category: 'VIATICOS', unit: 'día', basePrice: 15 },
  { code: 'ALIMENTACION_LOCAL', name: 'Viáticos alimentación local', category: 'VIATICOS', unit: 'día', basePrice: 10 },
  { code: 'TRANSPORTE_LARGO', name: 'Transporte de viajes largos', category: 'VIATICOS', unit: 'viaje', basePrice: 16 },
  { code: 'TRANSPORTE_INTERNO', name: 'Transporte de viajes internos', category: 'VIATICOS', unit: 'día', basePrice: 5 },
  { code: 'TABLETS', name: 'Tablets', category: 'MATERIALES', unit: 'unidad', basePrice: 80 },
  { code: 'GRABADORAS', name: 'Grabadoras', category: 'MATERIALES', unit: 'unidad', basePrice: 60 },
  { code: 'BATERIAS_CAMPO', name: 'Baterías de campo', category: 'MATERIALES', unit: 'unidad', basePrice: 25 },
  { code: 'CHALECOS_GAFETES', name: 'Chalecos y gafetes', category: 'MATERIALES', unit: 'unidad', basePrice: 20 },
  { code: 'SEGURO_ACCIDENTES', name: 'Seguro de accidentes', category: 'MATERIALES', unit: 'persona', basePrice: 20 },
  { code: 'SEGURO_RC', name: 'Seguro de responsabilidad civil', category: 'MATERIALES', unit: 'póliza', basePrice: 500 },
  { code: 'ADMINISTRATIVOS', name: 'Administrativos', category: 'MATERIALES', unit: 'unidad', basePrice: 75 },
  { code: 'DATOS_CONEXION', name: 'Datos, conexión y salas de trabajo', category: 'SERVICIOS', unit: 'persona-día', basePrice: 3.5 },
  { code: 'INCENTIVO_PILOTO', name: 'Incentivo unitario Piloto', category: 'INCENTIVOS', unit: 'encuesta', basePrice: 3.5 },
  { code: 'INCENTIVO_EVALUACION', name: 'Incentivo unitario Evaluación', category: 'INCENTIVOS', unit: 'encuesta', basePrice: 3.5 },
];

// Fases donde aplica la tabla completa de personal + viáticos (igual que en el Excel).
const PERSONNEL_PHASES = [
  'RECLUTAMIENTO',
  'PILOTO',
  'PREVISITA',
  'CAPACITACION_INICIAL',
  'PRECONTACTO',
  'CAPACITACION',
  'MANTENIMIENTO',
  'LEVANTAMIENTO',
  'REVISITA',
];
const PERSONNEL_CODES = ['ENCUESTADOR_LOCAL', 'SUPERVISOR_LOCAL', 'SOPORTE_T2T', 'COORDINADOR_LOCAL', 'SUPERVISOR_CORP', 'AUDITOR_CORP', 'COORDINADOR_CORP', 'DIRECTOR_CORP'];
const VIATICOS_CODES = ['HOTEL', 'ALIMENTACION_FORANEA', 'ALIMENTACION_LOCAL', 'TRANSPORTE_LARGO', 'TRANSPORTE_INTERNO'];
const MATERIALES_CODES = ['TABLETS', 'GRABADORAS', 'BATERIAS_CAMPO', 'CHALECOS_GAFETES', 'SEGURO_ACCIDENTES', 'SEGURO_RC', 'ADMINISTRATIVOS'];

async function seedCatalogAndRules(adminUserId: number) {
  const phaseByCode = new Map<string, Phase>();
  for (const p of PHASES) {
    const [phase] = await Phase.findOrCreate({ where: { code: p.code }, defaults: p });
    phaseByCode.set(p.code, phase);
  }

  const categoryByCode = new Map<string, CostCategory>();
  for (const c of CATEGORIES) {
    const [cat] = await CostCategory.findOrCreate({ where: { code: c.code }, defaults: c });
    categoryByCode.set(c.code, cat);
  }

  const itemByCode = new Map<string, CatalogItem>();
  for (const item of CATALOG_ITEMS) {
    const category = categoryByCode.get(item.category)!;
    const [row] = await CatalogItem.findOrCreate({
      where: { code: item.code },
      defaults: { categoryId: category.id, name: item.name, code: item.code, unitLabel: item.unit, active: true },
    });
    itemByCode.set(item.code, row);
  }

  const honduras = await Country.findOne({ where: { iso3: 'HND' } });
  if (!honduras) throw new Error('No se encontró Honduras, ejecute seedGeography primero');

  async function attachItemToPhase(phaseCode: string, itemCode: string, priceOverride?: number) {
    const phase = phaseByCode.get(phaseCode)!;
    const item = itemByCode.get(itemCode)!;
    const [phaseItem] = await PhaseItem.findOrCreate({
      where: { phaseId: phase.id, catalogItemId: item.id },
      defaults: { phaseId: phase.id, catalogItemId: item.id, active: true },
    });

    if (!honduras) {
      throw new Error('No se encontró Honduras, ejecute seedGeography primero');
    }

    const existingPrice = await CountryItemPrice.findOne({ where: { countryId: honduras.id, phaseItemId: phaseItem.id, active: true } });
    if (!existingPrice) {
      const catalogDef = CATALOG_ITEMS.find((c) => c.code === itemCode)!;
      await CountryItemPrice.create({
        countryId: honduras.id,
        phaseItemId: phaseItem.id,
        unitPriceUsd: priceOverride ?? catalogDef.basePrice,
        validFrom: new Date().toISOString().slice(0, 10),
        validTo: null,
        active: true,
        createdBy: adminUserId,
      });
    }
    return phaseItem;
  }

  for (const phaseCode of PERSONNEL_PHASES) {
    const phaseItems: Record<string, PhaseItem> = {};
    for (const code of [...PERSONNEL_CODES, ...VIATICOS_CODES]) {
      phaseItems[code] = await attachItemToPhase(phaseCode, code);
    }

    // Reglas de cantidad/días derivadas (según Modelo Cotizador Excel.xlsx).
    const supervisorCorpRatio = phaseCode === 'LEVANTAMIENTO' || phaseCode === 'REVISITA' ? 40 : 20;

    await CalculationRule.findOrCreate({
      where: { code: `CEIL_RATIO_SUPERVISOR_LOCAL_${phaseCode}` },
      defaults: {
        code: `CEIL_RATIO_SUPERVISOR_LOCAL_${phaseCode}`,
        name: `Supervisores locales por cada 5 encuestadores (${phaseCode})`,
        ruleType: 'CEIL_RATIO',
        paramsJson: { ratio: 5, baseItemCode: 'ENCUESTADOR_LOCAL' },
        phaseItemId: phaseItems['SUPERVISOR_LOCAL'].id,
        active: true,
      },
    });

    await CalculationRule.findOrCreate({
      where: { code: `CEIL_RATIO_SUPERVISOR_CORP_${phaseCode}` },
      defaults: {
        code: `CEIL_RATIO_SUPERVISOR_CORP_${phaseCode}`,
        name: `Supervisores corporativos por cada ${supervisorCorpRatio} encuestadores (${phaseCode})`,
        ruleType: 'CEIL_RATIO',
        paramsJson: { ratio: supervisorCorpRatio, baseItemCode: 'ENCUESTADOR_LOCAL' },
        phaseItemId: phaseItems['SUPERVISOR_CORP'].id,
        active: true,
      },
    });

    await CalculationRule.findOrCreate({
      where: { code: `CEIL_RATIO_AUDITOR_CORP_${phaseCode}` },
      defaults: {
        code: `CEIL_RATIO_AUDITOR_CORP_${phaseCode}`,
        name: `Auditores corporativos por cada 20 encuestadores (${phaseCode})`,
        ruleType: 'CEIL_RATIO',
        paramsJson: { ratio: 20, baseItemCode: 'ENCUESTADOR_LOCAL' },
        phaseItemId: phaseItems['AUDITOR_CORP'].id,
        active: true,
      },
    });

    await CalculationRule.findOrCreate({
      where: { code: `PERCENT_DAYS_COORDINADOR_CORP_${phaseCode}` },
      defaults: {
        code: `PERCENT_DAYS_COORDINADOR_CORP_${phaseCode}`,
        name: `Días de coordinador corporativo = 50% de los días de campo (${phaseCode})`,
        ruleType: 'PERCENT_OF_DAYS',
        paramsJson: { percent: 0.5, baseItemCode: 'ENCUESTADOR_LOCAL' },
        phaseItemId: phaseItems['COORDINADOR_CORP'].id,
        active: true,
      },
    });

    await CalculationRule.findOrCreate({
      where: { code: `PERCENT_DAYS_DIRECTOR_CORP_${phaseCode}` },
      defaults: {
        code: `PERCENT_DAYS_DIRECTOR_CORP_${phaseCode}`,
        name: `Días de director corporativo = 20% de los días de campo (${phaseCode})`,
        ruleType: 'PERCENT_OF_DAYS',
        paramsJson: { percent: 0.2, baseItemCode: 'ENCUESTADOR_LOCAL' },
        phaseItemId: phaseItems['DIRECTOR_CORP'].id,
        active: true,
      },
    });
  }

  for (const code of MATERIALES_CODES) {
    await attachItemToPhase('MATERIALES', code);
  }
  await attachItemToPhase('DATOS_CONEXION', 'DATOS_CONEXION');
  await attachItemToPhase('PILOTO', 'INCENTIVO_PILOTO');
  await attachItemToPhase('LEVANTAMIENTO', 'INCENTIVO_EVALUACION');

  console.log('✔ Fases, categorías, catálogo de conceptos, precios (Honduras) y reglas de cálculo sembrados.');
}

async function main() {
  await runSchema();
  await sequelize.authenticate();

  await seedRolesAndAdmin();
  const admin = await User.findOne({ where: { email: process.env.ADMIN_EMAIL || 'admin@example.com' } });
  if (!admin) throw new Error('No se pudo crear/encontrar el usuario administrador');

  await seedGeography(admin.id);
  await seedClient();
  await seedCatalogAndRules(admin.id);

  console.log('✔ Migración y siembra de datos completadas.');
  process.exit(0);
}

main().catch((error) => {
  console.error('Error ejecutando migración/siembra:', error);
  process.exit(1);
});
