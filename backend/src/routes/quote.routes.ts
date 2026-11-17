import { Router } from 'express';
import { quoteController } from '../controllers/quote.controller';
import { requireAuth, requireModuleAccess } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { createQuoteSchema, updateQuoteSchema, updateQuoteStatusSchema } from '../validations/quote.validation';

const router = Router();
router.use(requireAuth, requireModuleAccess('Cotizaciones'));
router.get('/', quoteController.list);
router.get('/:id', quoteController.getById);
router.post('/', validateBody(createQuoteSchema), quoteController.create);
router.put('/:id', validateBody(updateQuoteSchema), quoteController.update);
router.delete('/:id', quoteController.delete);
router.post('/:id/duplicate', quoteController.duplicate);
router.patch('/:id/status', validateBody(updateQuoteStatusSchema), quoteController.updateStatus);

export default router;
