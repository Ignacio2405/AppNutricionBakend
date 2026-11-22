import { Router } from 'express';
import { getObrasSociales, getObraSocialById,  createObraSocial,  updateObraSocial,  deleteObraSocial } from '../controllers/obraSocial.controller.js'; 
import { verificarToken } from '../middlewares/verificaJWT.middlware.js'; 
import {validarRol} from '../middlewares/validarRol.js';
import { RolEnum } from '../enum/Rol.enum.js';

const router = Router();

router.get('/', verificarToken, getObrasSociales);
router.get('/:id', verificarToken, getObraSocialById);
router.post('/', verificarToken, validarRol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA, RolEnum.MEDICO), createObraSocial);
router.put('/:id', verificarToken, validarRol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA, RolEnum.MEDICO), updateObraSocial);
router.delete('/:id', verificarToken, validarRol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA, RolEnum.MEDICO), deleteObraSocial);

export default router;