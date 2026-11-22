import { Router } from "express";
import {
  crearResultadosLaboratorio,
  obtenerResultadosLaboratorio,
  obtenerResultadosLaboratorioPorId,
  actualizarResultadosLaboratorio,
  eliminarResultadosLaboratorio,
} from "../controllers/resultadosLaboratorio.controller.js";
import { verificarToken } from '../middlewares/verificaJWT.middlware.js'; 
import {validarRol} from '../middlewares/validarRol.js';
import { RolEnum } from '../enum/Rol.enum.js';

const router = Router();

router.post("/",verificarToken, validarRol(RolEnum.ADMIN, RolEnum.MEDICO), crearResultadosLaboratorio);
router.get("/", verificarToken, validarRol(RolEnum.ADMIN, RolEnum.MEDICO),obtenerResultadosLaboratorio);
router.get("/:id", verificarToken, validarRol(RolEnum.ADMIN, RolEnum.MEDICO),obtenerResultadosLaboratorioPorId);
router.put("/:id", verificarToken, validarRol(RolEnum.ADMIN, RolEnum.MEDICO),actualizarResultadosLaboratorio);
router.delete("/:id",verificarToken, validarRol(RolEnum.ADMIN, RolEnum.MEDICO), eliminarResultadosLaboratorio);

export default router;