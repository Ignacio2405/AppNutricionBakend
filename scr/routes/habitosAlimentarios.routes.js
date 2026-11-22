import { Router } from "express";
import {
  crearHabitosAlimentarios,
  obtenerHabitosAlimentarios,
  obtenerHabitosAlimentariosPorId,
  actualizarHabitosAlimentarios,
  eliminarHabitosAlimentarios,
} from "../controllers/habitosAlimentarios.controller.js";
import { verificarToken } from '../middlewares/verificaJWT.middlware.js';
import { validarRol } from '../middlewares/validarRol.js';
import { RolEnum } from '../enum/Rol.enum.js';

const router = Router();

router.post("/crear",verificarToken,validarRol(RolEnum.ADMIN, RolEnum.MEDICO), crearHabitosAlimentarios);
router.get("/",verificarToken,validarRol(RolEnum.ADMIN, RolEnum.MEDICO), obtenerHabitosAlimentarios);
router.put("/actualizar/:id", verificarToken,validarRol(RolEnum.ADMIN, RolEnum.MEDICO),actualizarHabitosAlimentarios);
router.get("/:id", verificarToken,validarRol(RolEnum.ADMIN, RolEnum.MEDICO), obtenerHabitosAlimentariosPorId);

router.delete("/:id",verificarToken,validarRol(RolEnum.ADMIN, RolEnum.MEDICO), eliminarHabitosAlimentarios);

export default router;