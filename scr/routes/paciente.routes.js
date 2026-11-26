import { Router } from 'express';
import {  getPacientes,  getPacienteById,  createPaciente,  deletePaciente,  updatePaciente,  updateContactoDireccion 
} from '../controllers/paciente.controller.js'; 
import { verificarToken } from '../middlewares/verificaJWT.middlware.js'; 
import {validarRol} from '../middlewares/validarRol.js';
import { RolEnum } from '../enum/Rol.enum.js';

const router = Router();

router.post('/', verificarToken, validarRol(RolEnum.ADMIN, RolEnum.MEDICO, RolEnum.RECEPCIONISTA),createPaciente);

router.get('/', verificarToken, validarRol(RolEnum.ADMIN, RolEnum.MEDICO, RolEnum.RECEPCIONISTA, RolEnum.PACIENTE), getPacientes);
router.get('/:id', verificarToken, validarRol(RolEnum.ADMIN, RolEnum.MEDICO, RolEnum.RECEPCIONISTA, RolEnum.PACIENTE), getPacienteById);
router.put('/:id', verificarToken,validarRol(RolEnum.ADMIN, RolEnum.MEDICO, RolEnum.RECEPCIONISTA, RolEnum.PACIENTE), updatePaciente);
router.patch('/contacto-direccion/:id', verificarToken,validarRol(RolEnum.ADMIN, RolEnum.MEDICO, RolEnum.RECEPCIONISTA, RolEnum.PACIENTE), updateContactoDireccion);
router.delete('/:id', verificarToken,validarRol(RolEnum.ADMIN, RolEnum.MEDICO, RolEnum.RECEPCIONISTA), deletePaciente);

export default router;