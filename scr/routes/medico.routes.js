import { Router } from 'express';
import {  getMedicos, getMedicoById, createMedico, deleteMedico,  updateMedico,
} from '../controllers/medico.controller.js'; 
import { verificarToken } from '../middlewares/verificaJWT.middlware.js'; 
import { validarRol } from '../middlewares/validarRol.js';
import { RolEnum } from '../enum/Rol.enum.js';

const router = Router();

router.post('/', verificarToken, validarRol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA, RolEnum.MEDICO), createMedico);
router.get('/', verificarToken, getMedicos);
router.get('/:id', verificarToken, getMedicoById);
router.put('/:id', verificarToken,validarRol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA, RolEnum.MEDICO), updateMedico);
router.delete('/:id', verificarToken,validarRol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA, RolEnum.MEDICO), deleteMedico);

export default router;