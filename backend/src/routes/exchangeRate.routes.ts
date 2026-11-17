import { Router } from 'express';
import { exchangeRateController } from '../controllers/exchangeRate.controller';
import { requireAuth, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { exchangeRateSchema } from '../validations/maintenance.validation';

const router = Router();
router.use(requireAuth);
router.get('/', exchangeRateController.list);
router.post('/', requireRole('ADMINISTRADOR'), validateBody(exchangeRateSchema), exchangeRateController.create);
router.post('/:id/deactivate', requireRole('ADMINISTRADOR'), exchangeRateController.deactivate);

export default router;
