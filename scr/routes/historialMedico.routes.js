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

const router = Router();

router.post('/', crearHistorialMedico);
router.get('/', obtenerHistorialesMedicos);
router.get('/paciente/:pacienteId', obtenerHistorialPorPaciente);
router.get('/:id', obtenerHistorialMedicoPorId);
router.put('/:id', actualizarHistorialMedico);
router.delete('/:id', eliminarHistorialMedico);

export default router;