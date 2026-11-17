import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateBody } from '../middlewares/validate';
import { loginSchema } from '../validations/auth.validation';

const router = Router();
router.post('/login', validateBody(loginSchema), authController.login);

export default router;
