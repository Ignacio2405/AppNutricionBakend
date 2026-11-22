import { Router } from 'express';
import {login, registro, cambiarPasswordPrimerLogin } from '../controllers/auth.controller.js';
//import { limitadorLogin } from '../middlewares/rateLimit.middleware.js';
import { verificarToken } from '../middlewares/verificaJWT.middlware.js';
import { validarRol } from '../middlewares/validarRol.js';
import { RolEnum } from '../enum/Rol.enum.js';

const router = Router();

//router.post('/', limitadorLogin, login);

router.post('/', login);
router.post('/registro', validarRol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA), registro);
router.patch('/cambiar-contrasena', verificarToken, cambiarPasswordPrimerLogin)

export default router;