import { Router } from 'express';
import {
  crearHistorialMedico,
  obtenerHistorialesMedicos,
  obtenerHistorialMedicoPorId,
  obtenerHistorialPorPaciente,
  actualizarHistorialMedico,
  eliminarHistorialMedico
} from '../controllers/historialMedico.controller.js';
import { verificarToken } from '../middlewares/verificaJWT.middlware.js';
import { validarRol } from '../middlewares/validarRol.js';
import { RolEnum } from '../enum/Rol.enum.js';
const router = Router();

router.post('/', verificarToken, validarRol(RolEnum.ADMIN,RolEnum.MEDICO), crearHistorialMedico);
router.get('/',verificarToken, validarRol(RolEnum.ADMIN,RolEnum.MEDICO, RolEnum.PACIENTE), obtenerHistorialesMedicos);
router.get('/paciente/:pacienteId',verificarToken, validarRol(RolEnum.ADMIN,RolEnum.MEDICO,RolEnum.PACIENTE), obtenerHistorialPorPaciente);
router.get('/:id',verificarToken, validarRol(RolEnum.ADMIN,RolEnum.MEDICO,RolEnum.PACIENTE), obtenerHistorialMedicoPorId);
router.put('/:id',verificarToken, validarRol(RolEnum.ADMIN,RolEnum.MEDICO), actualizarHistorialMedico);
router.delete('/:id', verificarToken, validarRol(RolEnum.ADMIN,RolEnum.MEDICO),eliminarHistorialMedico);

export default router;