import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { requireAuth, requireModuleAccess } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { createUserSchema, updateUserSchema } from '../validations/user.validation';

const router = Router();
router.use(requireAuth, requireModuleAccess('Usuarios'));
router.get('/', userController.list);
router.get('/:id', userController.getById);
router.post('/', validateBody(createUserSchema), userController.create);
router.put('/:id', validateBody(updateUserSchema), userController.update);
router.post('/:id/deactivate', userController.deactivate);
router.post('/:id/activate', userController.activate);

export default router;
