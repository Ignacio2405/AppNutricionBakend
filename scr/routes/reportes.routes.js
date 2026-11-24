import { Router } from "express";
import { getInformePaciente } from "../controllers/reportes.controller.js";
import { verificarToken } from "../middlewares/verificaJWT.middlware.js";
import { validarRol } from "../middlewares/validarRol.js";
import { RolEnum } from "../enum/Rol.enum.js";

const router = Router();

router.get(
  "/paciente/:pacienteId",
  verificarToken,
  validarRol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA, RolEnum.MEDICO, RolEnum.PACIENTE),
  getInformePaciente,
);

export default router;