import { Router } from 'express';
import {  getPacientes,  getPacienteById,  createPaciente,  deletePaciente,  updatePaciente,  updateContactoDireccion 
} from '../controllers/paciente.controller.js'; 
import { verificarToken } from '../middlewares/verificaJWT.middlware.js'; 

const router = Router();

router.post('/', verificarToken, createPaciente);

router.get('/', verificarToken, getPacientes);
router.get('/:id', verificarToken, getPacienteById);
router.put('/:id', verificarToken, updatePaciente);
router.patch('/contacto-direccion/:id', verificarToken, updateContactoDireccion);
router.delete('/:id', verificarToken, deletePaciente);

export default router;