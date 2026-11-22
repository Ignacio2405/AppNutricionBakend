import { Router } from 'express';
import {  crearExcepcionAgenda,  getExcepcionesAgenda,  desactivarExcepcionAgenda 
} from '../controllers/excepcionAgenda.controller.js'; 
import { verificarToken } from '../middlewares/verificaJWT.middlware.js';
import { validarRol } from '../middlewares/validarRol.js';
import { RolEnum } from '../enum/Rol.enum.js';

const router = Router();

router.get('/', verificarToken,validarRol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA, RolEnum.MEDICO), getExcepcionesAgenda);
router.post('/',verificarToken,validarRol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA), crearExcepcionAgenda);
router.patch('/:id/desactivar',verificarToken,validarRol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA), desactivarExcepcionAgenda);

export default router;