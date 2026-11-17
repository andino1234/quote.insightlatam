import { Router } from 'express';
import { priceController } from '../controllers/price.controller';
import { requireAuth, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { countryItemPriceSchema } from '../validations/maintenance.validation';

const router = Router();
router.use(requireAuth);
router.get('/', priceController.list);
router.post('/', requireRole('ADMINISTRADOR'), validateBody(countryItemPriceSchema), priceController.create);
router.put('/:id', requireRole('ADMINISTRADOR'), validateBody(countryItemPriceSchema.partial()), priceController.update);
router.post('/:id/deactivate', requireRole('ADMINISTRADOR'), priceController.deactivate);

export default router;
