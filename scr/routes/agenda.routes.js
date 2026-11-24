import { Router } from 'express';
import {  getAgenda, createAgenda, updateAgenda , deleteAgenda,
} from '../controllers/agenda.controller.js'; 
import { verificarToken } from '../middlewares/verificaJWT.middlware.js'; 
import { validarHorario } from '../middlewares/validarHorarios.middlware.js';
import { validarRol } from '../middlewares/validarRol.js';
import { RolEnum } from '../enum/Rol.enum.js';
const router = Router();

router.post('/', verificarToken,validarRol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA, RolEnum.MEDICO), validarHorario, createAgenda);

router.get('/', verificarToken, getAgenda);
router.put('/:id', verificarToken, validarRol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA, RolEnum.MEDICO), updateAgenda);
router.delete('/:id', verificarToken, validarRol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA, RolEnum.MEDICO),deleteAgenda);

export default router;