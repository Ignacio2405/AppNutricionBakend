
import { Router } from 'express';

import { crearConsulta, obtenerConsultas, obtenerConsultaPorId, actualizarConsulta, eliminarConsulta
} from '../controllers/consultaMedica.controller.js';

const router = Router();

router.post('/', crearConsulta);
router.get('/', obtenerConsultas);
router.get('/:id', obtenerConsultaPorId);
router.put('/:id', actualizarConsulta);
router.delete('/:id', eliminarConsulta);

export default router;
