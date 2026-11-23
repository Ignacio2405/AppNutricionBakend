import { Router } from "express";
import {
  getMetasObjetivos,
  getMetaObjetivoById,
  createMetaObjetivo,
  updateMetaObjetivo,
  deleteMetaObjetivo,
} from "../controllers/metaObjetivo.controller.js";

const router = Router();

router.get("/", getMetasObjetivos);
router.get("/:id", getMetaObjetivoById);
router.post("/", createMetaObjetivo);
router.put("/:id", updateMetaObjetivo);
router.delete("/:id", deleteMetaObjetivo);

export default router;