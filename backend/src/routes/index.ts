import { Router } from 'express';
import authRoutes from './auth.routes';
import roleRoutes from './role.routes';
import userRoutes from './user.routes';
import quoteRoutes from './quote.routes';
import exchangeRateRoutes from './exchangeRate.routes';
import priceRoutes from './price.routes';
import {
  calculationRuleRoutes,
  catalogItemRoutes,
  clientRoutes,
  costCategoryRoutes,
  countryCalculationSettingRoutes,
  countryIncentiveRoutes,
  countryRoutes,
  currencyRoutes,
  phaseItemRoutes,
  phaseRoutes,
  teamConfigurationItemRoutes,
  teamConfigurationRoutes,
  workPlanAssignmentRoutes,
} from './maintenance.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/roles', roleRoutes);
router.use('/users', userRoutes);
router.use('/quotes', quoteRoutes);
router.use('/exchange-rates', exchangeRateRoutes);
router.use('/prices', priceRoutes);
router.use('/countries', countryRoutes);
router.use('/country-calculation-settings', countryCalculationSettingRoutes);
router.use('/country-incentives', countryIncentiveRoutes);
router.use('/work-plan-assignments', workPlanAssignmentRoutes);
router.use('/team-configurations', teamConfigurationRoutes);
router.use('/team-configuration-items', teamConfigurationItemRoutes);
router.use('/currencies', currencyRoutes);
router.use('/clients', clientRoutes);
router.use('/phases', phaseRoutes);
router.use('/cost-categories', costCategoryRoutes);
router.use('/catalog-items', catalogItemRoutes);
router.use('/phase-items', phaseItemRoutes);
router.use('/calculation-rules', calculationRuleRoutes);

export default router;
