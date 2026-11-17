import { Router } from 'express';
import { roleController } from '../controllers/role.controller';
import { requireAuth, requireModuleAccess } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { createRoleSchema, updateRoleSchema } from '../validations/role.validation';

const router = Router();

router.use(requireAuth, requireModuleAccess('Mantenimientos'));
router.get('/', roleController.list);
router.get('/:id', roleController.getById);
router.post('/', validateBody(createRoleSchema), roleController.create);
router.put('/:id', validateBody(updateRoleSchema), roleController.update);

export default router;
