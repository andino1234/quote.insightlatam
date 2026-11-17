import { createCrudController } from './crudControllerFactory';
import {
  calculationRuleService,
  catalogItemService,
  clientService,
  costCategoryService,
  countryCalculationSettingService,
  countryIncentiveService,
  countryService,
  currencyService,
  phaseItemService,
  phaseService,
  teamConfigurationItemService,
  teamConfigurationService,
  workPlanAssignmentService,
} from '../services/maintenance.service';

export const countryController = createCrudController(countryService);
export const currencyController = createCrudController(currencyService);
export const clientController = createCrudController(clientService);
export const phaseController = createCrudController(phaseService);
export const costCategoryController = createCrudController(costCategoryService);
export const catalogItemController = createCrudController(catalogItemService);
export const phaseItemController = createCrudController(phaseItemService);
export const calculationRuleController = createCrudController(calculationRuleService);
export const countryCalculationSettingController = createCrudController(countryCalculationSettingService);
export const countryIncentiveController = createCrudController(countryIncentiveService);
export const workPlanAssignmentController = createCrudController(workPlanAssignmentService);
export const teamConfigurationController = createCrudController(teamConfigurationService);
export const teamConfigurationItemController = createCrudController(teamConfigurationItemService);
