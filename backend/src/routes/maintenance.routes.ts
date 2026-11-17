import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import {
  calculationRuleController,
  catalogItemController,
  clientController,
  costCategoryController,
  countryCalculationSettingController,
  countryController,
  countryIncentiveController,
  currencyController,
  phaseController,
  phaseItemController,
  teamConfigurationController,
  teamConfigurationItemController,
  workPlanAssignmentController,
} from '../controllers/maintenance.controller';
import {
  calculationRuleSchema,
  catalogItemSchema,
  clientSchema,
  costCategorySchema,
  countryCalculationSettingSchema,
  countryIncentiveSchema,
  countrySchema,
  currencySchema,
  phaseItemSchema,
  phaseSchema,
  teamConfigurationItemSchema,
  teamConfigurationSchema,
  workPlanAssignmentSchema,
} from '../validations/maintenance.validation';

function crudRoutes(controller: typeof countryController, schema: z.ZodObject<any>, adminOnly: boolean) {
  const router = Router();
  router.use(requireAuth);
  router.get('/', controller.list);
  router.get('/:id', controller.getById);

  if (adminOnly) {
    router.post('/', requireRole('ADMINISTRADOR'), validateBody(schema), controller.create);
    router.put('/:id', requireRole('ADMINISTRADOR'), validateBody(schema.partial()), controller.update);
    router.post('/:id/deactivate', requireRole('ADMINISTRADOR'), controller.deactivate);
    router.post('/:id/activate', requireRole('ADMINISTRADOR'), controller.activate);
    return router;
  }

  router.post('/', validateBody(schema), controller.create);
  router.put('/:id', validateBody(schema.partial()), controller.update);
  router.post('/:id/deactivate', controller.deactivate);
  router.post('/:id/activate', controller.activate);
  return router;
}

export const countryRoutes = crudRoutes(countryController, countrySchema, false);
export const currencyRoutes = crudRoutes(currencyController, currencySchema, true);
export const clientRoutes = crudRoutes(clientController, clientSchema, false);
export const phaseRoutes = crudRoutes(phaseController, phaseSchema, true);
export const costCategoryRoutes = crudRoutes(costCategoryController, costCategorySchema, true);
export const catalogItemRoutes = crudRoutes(catalogItemController, catalogItemSchema, true);
export const phaseItemRoutes = crudRoutes(phaseItemController, phaseItemSchema, true);
export const calculationRuleRoutes = crudRoutes(calculationRuleController, calculationRuleSchema, true);
export const countryCalculationSettingRoutes = crudRoutes(countryCalculationSettingController, countryCalculationSettingSchema, false);
export const countryIncentiveRoutes = crudRoutes(countryIncentiveController, countryIncentiveSchema, false);
export const workPlanAssignmentRoutes = crudRoutes(workPlanAssignmentController, workPlanAssignmentSchema, false);
export const teamConfigurationRoutes = crudRoutes(teamConfigurationController, teamConfigurationSchema, false);
export const teamConfigurationItemRoutes = crudRoutes(teamConfigurationItemController, teamConfigurationItemSchema, false);
