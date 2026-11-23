import { Types } from "mongoose";
import { MetaObjetivo } from "../models/MetaObjetivo.js";

export const getMetasObjetivos = async (req, res) => {
  try {
    const { pacienteId, consultaId } = req.query;
    const filtro = { $or: [{ activo: true }, { activo: { $exists: false } }] };

    if (pacienteId && Types.ObjectId.isValid(pacienteId)) {
      filtro.pacienteId = new Types.ObjectId(pacienteId);
    }
    if (consultaId && Types.ObjectId.isValid(consultaId)) {
      filtro.consultaId = new Types.ObjectId(consultaId);
    }

    const metas = await MetaObjetivo.find(filtro)
      .populate("pacienteId", "nombre apellido dni email")
      .populate("consultaId", "fecha hora motivo observaciones")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      ok: true,
      mensaje: "Metas y objetivos obtenidos exitosamente",
      data: metas,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener metas y objetivos",
      error: error.message,
    });
  }
};

export const getMetaObjetivoById = async (req, res) => {
  try {
    const { id } = req.params;
    const meta = await MetaObjetivo.findOne({
      _id: id,
      $or: [{ activo: true }, { activo: { $exists: false } }],
    })
      .populate("pacienteId", "nombre apellido dni email")
      .populate("consultaId", "fecha hora motivo observaciones");

    if (!meta) {
      return res.status(404).json({
        ok: false,
        mensaje: "Registro de metas y objetivos no encontrado",
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: "Registro obtenido exitosamente",
      data: meta,
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      mensaje: "Error al obtener el registro de metas y objetivos",
      error: error.message,
    });
  }
};

export const createMetaObjetivo = async (req, res) => {
  try {
    const { pacienteId, consultaId, objetivos } = req.body;

    if (!pacienteId) {
      return res.status(400).json({
        ok: false,
        mensaje: "El paciente es obligatorio",
      });
    }

    const nuevaMeta = await MetaObjetivo.create({
      pacienteId,
      consultaId: consultaId || null,
      objetivos: Array.isArray(objetivos) ? objetivos : [],
    });

    await nuevaMeta.populate([
      { path: "pacienteId", select: "nombre apellido dni email" },
      { path: "consultaId", select: "fecha hora motivo observaciones" },
    ]);

    return res.status(201).json({
      ok: true,
      mensaje: "Metas y objetivos creados exitosamente",
      data: nuevaMeta,
    });
  } catch (error) {
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        ok: false,
        mensaje: "Datos inválidos al crear metas y objetivos",
        error: error.message,
      });
    }
    return res.status(500).json({
      ok: false,
      mensaje: "Error al crear metas y objetivos",
      error: error.message,
    });
  }
};

export const updateMetaObjetivo = async (req, res) => {
  try {
    const { id } = req.params;
    const bodyActualizado = { ...req.body };
    if (bodyActualizado.consultaId === "") {
      bodyActualizado.consultaId = null;
    }

    const metaActualizada = await MetaObjetivo.findOneAndUpdate(
      { _id: id, $or: [{ activo: true }, { activo: { $exists: false } }] },
      { $set: bodyActualizado },
      {
        returnDocument: "after",
        runValidators: true,
        context: "query",
      }
    )
      .populate("pacienteId", "nombre apellido dni email")
      .populate("consultaId", "fecha hora motivo observaciones");

    if (!metaActualizada) {
      return res.status(404).json({
        ok: false,
        mensaje: "Registro de metas y objetivos no encontrado",
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: "Metas y objetivos actualizados exitosamente",
      data: metaActualizada,
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      mensaje: "Error al actualizar metas y objetivos",
      error: error.message,
    });
  }
};

export const deleteMetaObjetivo = async (req, res) => {
  try {
    const { id } = req.params;

    const metaEliminada = await MetaObjetivo.findByIdAndUpdate(
      id,
      { $set: { activo: false } },
      { returnDocument: "after" }
    );

    if (!metaEliminada) {
      return res.status(404).json({
        ok: false,
        mensaje: "Registro de metas y objetivos no encontrado",
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: "Registro de metas y objetivos dado de baja correctamente",
      data: metaEliminada,
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      mensaje: "Error al dar de baja el registro",
      error: error.message,
    });
  }
};