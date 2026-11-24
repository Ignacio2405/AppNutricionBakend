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
import {validarRol} from '../middlewares/validarRol.js';
import { RolEnum } from '../enum/Rol.enum.js';

const router = Router();

// 1. RUTAS ESPECÍFICAS / ESTÁTICAS (Primero, para que Express no las confunda con un :id)
router.get('/pendientes-historicos', verificarToken, validarRol(RolEnum.ADMIN, RolEnum.MEDICO, RolEnum.PACIENTE, RolEnum.RECEPCIONISTA, RolEnum.USER), getTurnosPendientesHistoricos);
router.get('/turnos-disponibles', verificarToken,  validarRol(RolEnum.ADMIN, RolEnum.MEDICO, RolEnum.PACIENTE, RolEnum.RECEPCIONISTA, RolEnum.USER),getTurnosDisponibles);
router.get('/turnos-disponibles-mes', verificarToken,  validarRol(RolEnum.ADMIN, RolEnum.MEDICO, RolEnum.PACIENTE, RolEnum.RECEPCIONISTA, RolEnum.USER),getDisponibilidadMes);
router.get('/mis-turnos', verificarToken, validarRol(RolEnum.MEDICO, RolEnum.PACIENTE), getMisTurnos);

// 2. RUTAS CRUD BÁSICAS
router.post('/', verificarToken, validarRol(RolEnum.ADMIN, RolEnum.MEDICO, RolEnum.PACIENTE, RolEnum.RECEPCIONISTA, RolEnum.USER), createTurno);
router.get('/', verificarToken, validarRol(RolEnum.ADMIN, RolEnum.MEDICO, RolEnum.PACIENTE, RolEnum.RECEPCIONISTA, RolEnum.USER), getTurnos);

// 3. RUTAS CON PARÁMETROS DINÁMICOS (Siempre al final)
router.get('/mis-turnos/:id', verificarToken, validarRol(RolEnum.MEDICO, RolEnum.PACIENTE), getMiTurnoById);
router.get('/:id', verificarToken, getTurnoById);
router.put('/:id', verificarToken, updateTurno);
router.patch('/:id/cancelar', verificarToken,  validarRol(RolEnum.ADMIN, RolEnum.MEDICO, RolEnum.RECEPCIONISTA),cancelarTurno);
router.patch('/:id/atendido', verificarToken,validarRol(RolEnum.ADMIN, RolEnum.MEDICO, RolEnum.RECEPCIONISTA), marcarAtendido);
router.delete('/:id', verificarToken,validarRol(RolEnum.ADMIN, RolEnum.MEDICO, RolEnum.RECEPCIONISTA), deleteTurno);

export default router;
