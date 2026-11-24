import { Router } from "express";
import {
  crearPago,
  obtenerPagos,
  anularPago,
} from "../controllers/pago.controller.js";
import { verificarToken } from "../middlewares/verificaJWT.middlware.js";
import { validarRol } from "../middlewares/validarRol.js";
import { RolEnum } from "../enum/Rol.enum.js";

const router = Router();

router.get(
  "/",
  verificarToken,
  validarRol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA, RolEnum.MEDICO),
  obtenerPagos,
);

router.post(
  "/",
  verificarToken,
  validarRol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA),
  crearPago,
);

router.patch(
  "/:id/anular",
  verificarToken,
  validarRol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA),
  anularPago,
);

export default router;