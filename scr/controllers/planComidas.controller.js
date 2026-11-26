import mongoose from "mongoose";
import { PlanComidas } from "../models/PlanComidas.js";
import { Paciente } from "../models/Paciente.js";
import "../models/Consulta.js";
import { RolEnum } from "../enum/Rol.enum.js";
import {
  ejecutarConsultaPaginada,
  obtenerParametrosPaginacion,
} from "../utils/paginacion.js";

const esObjectIdValido = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizarArray = (valor) => (Array.isArray(valor) ? valor : []);

const buscarPacientePorUsuario = async (usuario) => {
  if (!usuario) return null;
  const usuarioId = usuario.id || usuario._id;
  const emailNormalizado = String(usuario.email || "").toLowerCase().trim();

  if (usuarioId && esObjectIdValido(usuarioId)) {
    const pacienteVinculado = await Paciente.findOne({
      usuario: new mongoose.Types.ObjectId(usuarioId),
    }).lean();
    if (pacienteVinculado) return pacienteVinculado;
  }

  return emailNormalizado
    ? Paciente.findOne({ email: emailNormalizado }).lean()
    : null;
};

// GET /api/planes-comidas
export const getPlanesComidas = async (req, res) => {
  try {
    const { patientId, consultationId, planActivo } = req.query;
    const filtro = { activo: true };
    const paginacion = obtenerParametrosPaginacion(req.query);
    if (!paginacion) {
      return res.status(400).json({
        ok: false,
        mensaje: "Los parámetros page y limit deben ser enteros positivos.",
      });
    }

    const usuario = req.usuario || req.user;
    const rolUsuario = String(usuario?.rol || "").toUpperCase();

    if (rolUsuario === RolEnum.PACIENTE || rolUsuario === "PACIENTE") {
      const pacienteDoc = await buscarPacientePorUsuario(usuario);
      if (!pacienteDoc) {
        return res.status(200).json({
          ok: true,
          data: [],
          pagination: {
            page: paginacion.page,
            limit: paginacion.limit,
            total: 0,
            totalPages: 1,
          },
        });
      }
      filtro.patientId = pacienteDoc._id;
    } else if (patientId) {
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

    const { data: planes, pagination } = await ejecutarConsultaPaginada(
      PlanComidas.find(filtro)
        .populate("patientId", "nombre apellido dni email telefono")
        .populate("consultationId", "fecha hora observaciones")
        .sort({ fechaInicioVigencia: -1, createdAt: -1, _id: -1 }),
      PlanComidas,
      filtro,
      paginacion,
    );

    return res.status(200).json({
      ok: true,
      data: planes,
      pagination,
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

    const usuario = req.usuario || req.user;
    const rolUsuario = String(usuario?.rol || "").toUpperCase();
    if (rolUsuario === RolEnum.PACIENTE || rolUsuario === "PACIENTE") {
      const pacienteDoc = await buscarPacientePorUsuario(usuario);
      const planPacienteId = String(
        plan.patientId?._id || plan.patientId || "",
      );
      if (!pacienteDoc || planPacienteId !== String(pacienteDoc._id)) {
        return res.status(403).json({
          ok: false,
          mensaje: "No tenés permiso para ver este plan de comidas.",
        });
      }
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
      paciente,
      consultationId,
      consulta,
      titulo,
      tipoPlan,
      fechaEntrega,
      fechaInicioVigencia,
      fechaFinRevision,
      planActivo = true,
      objetivosMacros,
      grupoDeAlimentos,
      distribucionEquivalencias,
      recetasEjemplos,
      recomendacionesGenerales,
      advertencias,
    } = req.body;

    const idPaciente = patientId || paciente;
    const idConsulta = consultationId || consulta;

    if (!idPaciente || !esObjectIdValido(idPaciente)) {
      return res.status(400).json({
        ok: false,
        mensaje: "Debés proporcionar un ID de paciente válido.",
      });
    }

    if (idConsulta && !esObjectIdValido(idConsulta)) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID de consulta proporcionado no es válido.",
      });
    }

    if (Boolean(planActivo)) {
      await PlanComidas.updateMany(
        { patientId: idPaciente, activo: true, planActivo: true },
        { $set: { planActivo: false } }
      );
    }

    const nuevoPlan = await PlanComidas.create({
      patientId: idPaciente,
      consultationId: idConsulta || null,
      titulo,
      tipoPlan: tipoPlan || "",
      fechaEntrega: fechaEntrega || new Date(),
      fechaInicioVigencia,
      fechaFinRevision: fechaFinRevision || null,
      planActivo: Boolean(planActivo),
      objetivosMacros: objetivosMacros || {},
      grupoDeAlimentos: normalizarArray(grupoDeAlimentos),
      distribucionEquivalencias: normalizarArray(distribucionEquivalencias),
      recetasEjemplos: normalizarArray(recetasEjemplos),
      recomendacionesGenerales: normalizarArray(recomendacionesGenerales),
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
      paciente,
      consultationId,
      consulta,
      titulo,
      tipoPlan,
      fechaEntrega,
      fechaInicioVigencia,
      fechaFinRevision,
      planActivo,
      objetivosMacros,
      grupoDeAlimentos,
      distribucionEquivalencias,
      recetasEjemplos,
      recomendacionesGenerales,
      advertencias,
    } = req.body;

    const idPaciente = patientId !== undefined ? patientId : paciente;
    const idConsulta =
      consultationId !== undefined ? consultationId : consulta;

    if (idPaciente !== undefined && !esObjectIdValido(idPaciente)) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID de paciente no es válido.",
      });
    }

    if (idConsulta && !esObjectIdValido(idConsulta)) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID de consulta no es válido.",
      });
    }

    const nuevoPatientId = idPaciente || planExistente.patientId;

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

    if (idPaciente !== undefined) planExistente.patientId = idPaciente;
    if (idConsulta !== undefined) {
      planExistente.consultationId = idConsulta || null;
    }
    if (titulo !== undefined) planExistente.titulo = titulo;
    if (tipoPlan !== undefined) planExistente.tipoPlan = tipoPlan;
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
      planExistente.grupoDeAlimentos = normalizarArray(grupoDeAlimentos);
    }
    if (distribucionEquivalencias !== undefined) {
      planExistente.distribucionEquivalencias = normalizarArray(
        distribucionEquivalencias
      );
    }
    if (recetasEjemplos !== undefined) {
      planExistente.recetasEjemplos = normalizarArray(recetasEjemplos);
    }
    if (recomendacionesGenerales !== undefined) {
      planExistente.recomendacionesGenerales = normalizarArray(
        recomendacionesGenerales
      );
    }
    if (advertencias !== undefined) {
      planExistente.advertencias = normalizarArray(advertencias);
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