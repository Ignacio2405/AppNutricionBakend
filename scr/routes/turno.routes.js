import { Router } from 'express';
import {
    getTurnos, 
    getTurnoById,  
    getTurnosDisponibles, 
    getDisponibilidadMes,  
    createTurno, 
    updateTurno, 
    deleteTurno, 
    marcarAtendido, 
    getTurnosPendientesHistoricos, 
    getMisTurnos,
    getMiTurnoById,
    cancelarTurno
} from '../controllers/turno.controller.js'; 
import { verificarToken } from '../middlewares/verificaJWT.middlware.js'; 

const router = Router();

// 1. RUTAS ESPECÍFICAS / ESTÁTICAS (Primero, para que Express no las confunda con un :id)
router.get('/pendientes-historicos', verificarToken, getTurnosPendientesHistoricos);
router.get('/turnos-disponibles', verificarToken, getTurnosDisponibles);
router.get('/turnos-disponibles-mes', verificarToken, getDisponibilidadMes);
router.get('/mis-turnos', verificarToken, getMisTurnos); // (Asegúrate de importar getMisTurnos si lo usas)

// 2. RUTAS CRUD BÁSICAS
router.post('/', verificarToken, createTurno);
router.get('/', verificarToken, getTurnos);

// 3. RUTAS CON PARÁMETROS DINÁMICOS (Siempre al final)
router.get('/mis-turnos/:id', verificarToken, getMiTurnoById);
router.get('/:id', verificarToken, getTurnoById);
router.put('/:id', verificarToken, updateTurno);
router.patch('/:id/cancelar', verificarToken, cancelarTurno);
router.patch('/:id/atendido', verificarToken, marcarAtendido);
router.delete('/:id', verificarToken, deleteTurno);

export default router;
