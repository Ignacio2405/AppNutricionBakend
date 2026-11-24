
import { Router } from 'express';

import { crearConsulta, obtenerConsultas, obtenerConsultaPorId, actualizarConsulta, eliminarConsulta
} from '../controllers/consultaMedica.controller.js';
import { verificarToken } from '../middlewares/verificaJWT.middlware.js';
import { validarRol } from '../middlewares/validarRol.js';
import { RolEnum } from '../enum/Rol.enum.js';

const router = Router();

router.post('/',verificarToken, validarRol(RolEnum.MEDICO, RolEnum.ADMIN), crearConsulta);
router.get('/',verificarToken, validarRol(RolEnum.MEDICO, RolEnum.ADMIN, RolEnum.PACIENTE), obtenerConsultas);
router.get('/:id',verificarToken, validarRol(RolEnum.MEDICO, RolEnum.ADMIN, RolEnum.PACIENTE), obtenerConsultaPorId);
router.put('/:id', verificarToken, validarRol(RolEnum.MEDICO, RolEnum.ADMIN), actualizarConsulta);
router.delete('/:id', verificarToken, validarRol(RolEnum.MEDICO, RolEnum.ADMIN), eliminarConsulta);

export default router;
