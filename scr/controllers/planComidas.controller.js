import mongoose from "mongoose";
import { PlanComidas } from "../models/PlanComidas.js";
import "../models/Consulta.js"; 
import "../models/Paciente.js";
const esObjectIdValido = (id) => mongoose.Types.ObjectId.isValid(id);

// GET /api/planes-comidas
export const getPlanesComidas = async (req, res) => {
  try {
    const { patientId, consultationId, planActivo } = req.query;
    const filtro = { activo: true };

    if (patientId) {
      if (!esObjectIdValido(patientId)) {
        return res.status(400).json({
          ok: false,
          mensaje: "El ID de paciente no es válido.",
        });
      }
      filtro.patientId = patientId;
    }

    if (consultationId) {
      if (!esObjectIdValido(consultationId)) {
        return res.status(400).json({
          ok: false,
          mensaje: "El ID de consulta no es válido.",
        });
      }
      filtro.consultationId = consultationId;
    }

    if (planActivo !== undefined) {
      filtro.planActivo = planActivo === "true";
    }

    const planes = await PlanComidas.find(filtro)
      .populate("patientId", "nombre apellido dni email telefono")
      .populate("consultationId", "fecha hora observaciones")
      .sort({ fechaInicioVigencia: -1, createdAt: -1 });

    return res.status(200).json({
      ok: true,
      data: planes,
    });
  } catch (error) {
    console.error("Error al obtener planes de comidas:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error en el servidor al obtener los planes de comidas.",
      error: error.message,
    });
  }
};

// GET /api/planes-comidas/:id
export const getPlanComidasById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!esObjectIdValido(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID del plan de comidas no es válido.",
      });
    }

    const plan = await PlanComidas.findOne({ _id: id, activo: true })
      .populate("patientId", "nombre apellido dni fechaNacimiento email telefono")
      .populate("consultationId", "fecha hora observaciones");

    if (!plan) {
      return res.status(404).json({
        ok: false,
        mensaje: "Plan de comidas no encontrado.",
      });
    }

    return res.status(200).json({
      ok: true,
      data: plan,
    });
  } catch (error) {
    console.error("Error al obtener plan de comidas por ID:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error en el servidor al obtener el plan de comidas.",
      error: error.message,
    });
  }
};

// POST /api/planes-comidas
export const createPlanComidas = async (req, res) => {
  try {
    const {
      patientId,
      consultationId,
      titulo,
      fechaEntrega,
      fechaInicioVigencia,
      fechaFinRevision,
      planActivo = true,
      objetivosMacros,
      grupoDeAlimentos,
      advertencias,
    } = req.body;

    if (!patientId || !esObjectIdValido(patientId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "Debés proporcionar un ID de paciente válido.",
      });
    }

    if (consultationId && !esObjectIdValido(consultationId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID de consulta proporcionado no es válido.",
      });
    }

    if (Boolean(planActivo)) {
      await PlanComidas.updateMany(
        { patientId, activo: true, planActivo: true },
        { $set: { planActivo: false } }
      );
    }

    const nuevoPlan = await PlanComidas.create({
      patientId,
      consultationId: consultationId || null,
      titulo,
      fechaEntrega: fechaEntrega || new Date(),
      fechaInicioVigencia,
      fechaFinRevision: fechaFinRevision || null,
      planActivo: Boolean(planActivo),
      objetivosMacros: objetivosMacros || {},
      grupoDeAlimentos: Array.isArray(grupoDeAlimentos) ? grupoDeAlimentos : [],
      ...(Array.isArray(advertencias) && advertencias.length > 0
        ? { advertencias }
        : {}),
    });

    const planPopulado = await PlanComidas.findById(nuevoPlan._id)
      .populate("patientId", "nombre apellido dni")
      .populate("consultationId", "fecha hora observaciones");

    return res.status(201).json({
      ok: true,
      mensaje: "Plan de comidas creado con éxito.",
      data: planPopulado,
    });
  } catch (error) {
    console.error("Error al crear plan de comidas:", error);

    if (error.name === "ValidationError") {
      const errores = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        ok: false,
        mensaje: "Error de validación en los datos del plan de comidas.",
        errores,
      });
    }

    return res.status(500).json({
      ok: false,
      mensaje: "Error en el servidor al crear el plan de comidas.",
      error: error.message,
    });
  }
};

// PUT /api/planes-comidas/:id
export const updatePlanComidas = async (req, res) => {
  try {
    const { id } = req.params;

    if (!esObjectIdValido(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID del plan de comidas no es válido.",
      });
    }

    const planExistente = await PlanComidas.findOne({ _id: id, activo: true });
    if (!planExistente) {
      return res.status(404).json({
        ok: false,
        mensaje: "Plan de comidas no encontrado.",
      });
    }

    const {
      patientId,
      consultationId,
      titulo,
      fechaEntrega,
      fechaInicioVigencia,
      fechaFinRevision,
      planActivo,
      objetivosMacros,
      grupoDeAlimentos,
      advertencias,
    } = req.body;

    if (patientId && !esObjectIdValido(patientId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID de paciente no es válido.",
      });
    }

    if (consultationId && !esObjectIdValido(consultationId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID de consulta no es válido.",
      });
    }

    const nuevoPatientId = patientId || planExistente.patientId;

    if (planActivo === true) {
      await PlanComidas.updateMany(
        {
          _id: { $ne: planExistente._id },
          patientId: nuevoPatientId,
          activo: true,
          planActivo: true,
        },
        { $set: { planActivo: false } }
      );
    }

    if (patientId !== undefined) planExistente.patientId = patientId;
    if (consultationId !== undefined) {
      planExistente.consultationId = consultationId || null;
    }
    if (titulo !== undefined) planExistente.titulo = titulo;
    if (fechaEntrega !== undefined) planExistente.fechaEntrega = fechaEntrega;
    if (fechaInicioVigencia !== undefined) {
      planExistente.fechaInicioVigencia = fechaInicioVigencia;
    }
    if (fechaFinRevision !== undefined) {
      planExistente.fechaFinRevision = fechaFinRevision || null;
    }
    if (planActivo !== undefined) {
      planExistente.planActivo = Boolean(planActivo);
    }
    if (objetivosMacros !== undefined) {
      planExistente.objetivosMacros = {
        ...planExistente.objetivosMacros?.toObject?.(),
        ...objetivosMacros,
      };
    }
    if (grupoDeAlimentos !== undefined) {
      planExistente.grupoDeAlimentos = Array.isArray(grupoDeAlimentos)
        ? grupoDeAlimentos
        : [];
    }
    if (advertencias !== undefined) {
      planExistente.advertencias = Array.isArray(advertencias)
        ? advertencias
        : [];
    }

    await planExistente.save();

    const planActualizado = await PlanComidas.findById(planExistente._id)
      .populate("patientId", "nombre apellido dni")
      .populate("consultationId", "fecha hora observaciones");

    return res.status(200).json({
      ok: true,
      mensaje: "Plan de comidas actualizado con éxito.",
      data: planActualizado,
    });
  } catch (error) {
    console.error("Error al actualizar plan de comidas:", error);

    if (error.name === "ValidationError") {
      const errores = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        ok: false,
        mensaje: "Error de validación al actualizar el plan de comidas.",
        errores,
      });
    }

    return res.status(500).json({
      ok: false,
      mensaje: "Error en el servidor al actualizar el plan de comidas.",
      error: error.message,
    });
  }
};

// DELETE /api/planes-comidas/:id (borrado lógico)
export const deletePlanComidas = async (req, res) => {
  try {
    const { id } = req.params;

    if (!esObjectIdValido(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID del plan de comidas no es válido.",
      });
    }

    const planEliminado = await PlanComidas.findOneAndUpdate(
      { _id: id, activo: true },
      { $set: { activo: false, planActivo: false } },
      { new: true }
    );

    if (!planEliminado) {
      return res.status(404).json({
        ok: false,
        mensaje: "Plan de comidas no encontrado.",
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: "Plan de comidas eliminado con éxito.",
    });
  } catch (error) {
    console.error("Error al eliminar plan de comidas:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error en el servidor al eliminar el plan de comidas.",
      error: error.message,
    });
  }
};