import { Router } from "express";
import {
  getMetasObjetivos,
  getMetaObjetivoById,
  createMetaObjetivo,
  updateMetaObjetivo,
  deleteMetaObjetivo,
} from "../controllers/metaObjetivo.controller.js";
import { verificarToken } from "../middlewares/verificaJWT.middlware.js";
import { validarRol } from "../middlewares/validarRol.js";
import { RolEnum } from "../enum/Rol.enum.js";

const router = Router();

router.use(verificarToken);

router.get(
  "/",
  validarRol(
    RolEnum.ADMIN,
    RolEnum.RECEPCIONISTA,
    RolEnum.MEDICO,
    RolEnum.PACIENTE,
  ),
  getMetasObjetivos,
);
router.get(
  "/:id",
  validarRol(
    RolEnum.ADMIN,
    RolEnum.RECEPCIONISTA,
    RolEnum.MEDICO,
    RolEnum.PACIENTE,
  ),
  getMetaObjetivoById,
);
router.post(
  "/",
  validarRol(RolEnum.ADMIN, RolEnum.MEDICO, RolEnum.PACIENTE),
  createMetaObjetivo,
);
router.put(
  "/:id",
  validarRol(RolEnum.ADMIN, RolEnum.MEDICO),
  updateMetaObjetivo,
);
router.delete(
  "/:id",
  validarRol(RolEnum.ADMIN, RolEnum.MEDICO),
  deleteMetaObjetivo,
);

export default router;