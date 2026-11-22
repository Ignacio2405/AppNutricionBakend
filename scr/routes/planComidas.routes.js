import { Router } from "express";
import {
  getPlanesComidas,
  getPlanComidasById,
  createPlanComidas,
  updatePlanComidas,
  deletePlanComidas,
} from "../controllers/planComidas.controller.js";
import { verificarToken } from "../middlewares/verificaJWT.middlware.js";
import { validarRol } from "../middlewares/validarRol.js";
import { RolEnum } from "../enum/Rol.enum.js";

const router = Router();

router.get("/", verificarToken, getPlanesComidas);
router.get("/:id", verificarToken, getPlanComidasById);
router.post("/", verificarToken, validarRol(RolEnum.ADMIN, RolEnum.MEDICO), createPlanComidas);
router.put("/:id", verificarToken, validarRol(RolEnum.ADMIN, RolEnum.MEDICO), updatePlanComidas);
router.delete("/:id", verificarToken, validarRol(RolEnum.ADMIN, RolEnum.MEDICO), deletePlanComidas);

export default router;