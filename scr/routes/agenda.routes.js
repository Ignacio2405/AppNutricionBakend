import { Router } from 'express';
import {  getAgenda, createAgenda, updateAgenda , deleteAgenda,
} from '../controllers/agenda.controller.js'; 
import { verificarToken } from '../middlewares/verificaJWT.middlware.js'; 
import { validarHorario } from '../middlewares/validarHorarios.middlware.js';
import { verificarTurnoValido } from '../middlewares/verificarTurnoValido.middleware.js';
const router = Router();

router.post('/', verificarToken, validarHorario, createAgenda);

router.get('/', verificarToken, getAgenda);
router.put('/:id', verificarToken, updateAgenda);
router.delete('/:id', verificarToken, deleteAgenda);

export default router;