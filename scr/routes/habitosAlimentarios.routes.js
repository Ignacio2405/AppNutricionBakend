import { Router } from "express";
import {
  crearHabitosAlimentarios,
  obtenerHabitosAlimentarios,
  obtenerHabitosAlimentariosPorId,
  actualizarHabitosAlimentarios,
  eliminarHabitosAlimentarios,
} from "../controllers/habitosAlimentarios.controller.js";
// import { verificarToken } from "../middlewares/auth.middleware.js"; 

const router = Router();

router.post("/crear", crearHabitosAlimentarios);
router.get("/", obtenerHabitosAlimentarios);
router.put("/actualizar/:id", actualizarHabitosAlimentarios);
router.get("/:id", obtenerHabitosAlimentariosPorId);

router.delete("/:id", eliminarHabitosAlimentarios);

export default router;