import { Router } from 'express';
import {  listar,  obtenerUna,  crear,  actualizar,  eliminar 
} from '../controllers/consulta.controller.js'; 

const router = Router();

router.get('/', listar);
router.post('/', crear);
router.get('/:id', obtenerUna);
router.put('/:id', actualizar);
router.delete('/:id', eliminar);

export default router;