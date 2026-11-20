import { Router } from 'express';
import { getObrasSociales, getObraSocialById,  createObraSocial,  updateObraSocial,  deleteObraSocial } from '../controllers/obraSocial.controller.js'; 
import { verificarToken } from '../middlewares/verificaJWT.middlware.js'; 

const router = Router();

router.get('/', verificarToken, getObrasSociales);
router.get('/:id', verificarToken, getObraSocialById);
router.post('/', verificarToken, createObraSocial);
router.put('/:id', verificarToken, updateObraSocial);
router.delete('/:id', verificarToken, deleteObraSocial);

export default router;