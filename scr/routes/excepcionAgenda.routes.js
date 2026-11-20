import { Router } from 'express';
import {  crearExcepcionAgenda,  getExcepcionesAgenda,  desactivarExcepcionAgenda 
} from '../controllers/excepcionAgenda.controller.js'; 

const router = Router();

router.get('/', getExcepcionesAgenda);
router.post('/', crearExcepcionAgenda);
router.patch('/:id/desactivar', desactivarExcepcionAgenda);

export default router;