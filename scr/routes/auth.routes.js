import { Router } from 'express';
import {login, registro, cambiarPasswordPrimerLogin } from '../controllers/auth.controller.js';
import { limitadorLogin } from '../middlewares/rateLimit.middleware.js';
import { verificarToken } from '../middlewares/verificaJWT.middlware.js';
const router = Router();

router.post('/', limitadorLogin, login);
router.post('/registro', registro);
router.patch('/cambiar-contrasena', verificarToken, cambiarPasswordPrimerLogin)

export default router;