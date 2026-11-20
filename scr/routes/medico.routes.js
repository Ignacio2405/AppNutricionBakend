import { Router } from 'express';
import {  getMedicos, getMedicoById, createMedico, deleteMedico,  updateMedico,
} from '../controllers/medico.controller.js'; 
import { verificarToken } from '../middlewares/verificaJWT.middlware.js'; 

const router = Router();

router.post('/', verificarToken, createMedico);

router.get('/', verificarToken, getMedicos);
router.get('/:id', verificarToken, getMedicoById);
router.put('/:id', verificarToken, updateMedico);
router.delete('/:id', verificarToken, deleteMedico);

export default router;