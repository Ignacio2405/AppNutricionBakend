import { Types } from "mongoose";
import { MetaObjetivo } from "../models/MetaObjetivo.js";
import "../models/Paciente.js";
import "../models/Consulta.js";

const esObjectIdValido = (id) => Types.ObjectId.isValid(id);

const normalizarConsultaId = (valor) => {
  if (valor === undefined || valor === null) return null;
  const limpio = String(valor).trim();
  return limpio === "" ? null : limpio;
};

const poblarMetaObjetivo = (query) =>
  query
    .populate("pacienteId", "nombre apellido dni email")
    .populate("consultaId", "fecha hora motivo observaciones");

export const getMetasObjetivos = async (req, res) => {
  try {
    const { pacienteId, consultaId } = req.query;
    const filtro = { $or: [{ activo: true }, { activo: { $exists: false } }] };

    if (pacienteId) {
      if (!esObjectIdValido(pacienteId)) {
        return res.status(400).json({
          ok: false,
          mensaje: "El ID de paciente no es válido",
        });
      }
      filtro.pacienteId = new Types.ObjectId(pacienteId);
    }

    if (consultaId) {
      if (!esObjectIdValido(consultaId)) {
        return res.status(400).json({
          ok: false,
          mensaje: "El ID de consulta no es válido",
        });
      }
      filtro.consultaId = new Types.ObjectId(consultaId);
    }

    const metas = await poblarMetaObjetivo(MetaObjetivo.find(filtro)).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      ok: true,
      mensaje: "Metas y objetivos obtenidos exitosamente",
      data: metas,
    });
  } catch (error) {
    console.error("Error en getMetasObjetivos:", error);
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

    if (!esObjectIdValido(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID del registro no es válido",
      });
    }

    const meta = await poblarMetaObjetivo(
      MetaObjetivo.findOne({
        _id: id,
        $or: [{ activo: true }, { activo: { $exists: false } }],
      })
    );

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
    console.error("Error en getMetaObjetivoById:", error);
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

    if (!pacienteId || !esObjectIdValido(pacienteId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "El paciente es obligatorio y debe tener un ID válido",
      });
    }

    const idConsulta = normalizarConsultaId(consultaId);

    if (idConsulta && !esObjectIdValido(idConsulta)) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID de consulta no es válido",
      });
    }

    const objetivosNormalizados = Array.isArray(objetivos)
      ? objetivos.map((item) => ({
          description: item?.description ?? item?.descripcion ?? "",
          frecuenciaEsperada:
            item?.frecuenciaEsperada ?? item?.frecuencia ?? "diaria",
          status: item?.status ?? item?.estado ?? "activo",
          registro: Array.isArray(item?.registro) ? item.registro : [],
        }))
      : [];

    const nuevaMeta = await MetaObjetivo.create({
      pacienteId,
      consultaId: idConsulta,
      objetivos: objetivosNormalizados,
    });

    const metaPopulada = await poblarMetaObjetivo(
      MetaObjetivo.findById(nuevaMeta._id)
    );

    return res.status(201).json({
      ok: true,
      mensaje: "Metas y objetivos creados exitosamente",
      data: metaPopulada || nuevaMeta,
    });
  } catch (error) {
    console.error("Error en createMetaObjetivo:", error);

    if (error?.name === "ValidationError" || error?.name === "CastError") {
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

    if (!esObjectIdValido(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID del registro no es válido",
      });
    }

    const bodyActualizado = { ...req.body };

    if ("consultaId" in bodyActualizado) {
      bodyActualizado.consultaId = normalizarConsultaId(
        bodyActualizado.consultaId
      );
    }

    if (
      bodyActualizado.pacienteId &&
      !esObjectIdValido(bodyActualizado.pacienteId)
    ) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID de paciente no es válido",
      });
    }

    if (
      bodyActualizado.consultaId &&
      !esObjectIdValido(bodyActualizado.consultaId)
    ) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID de consulta no es válido",
      });
    }

    const metaActualizada = await poblarMetaObjetivo(
      MetaObjetivo.findOneAndUpdate(
        { _id: id, $or: [{ activo: true }, { activo: { $exists: false } }] },
        { $set: bodyActualizado },
        {
          returnDocument: "after",
          runValidators: true,
          context: "query",
        }
      )
    );

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
    console.error("Error en updateMetaObjetivo:", error);
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

    if (!esObjectIdValido(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID del registro no es válido",
      });
    }

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
    console.error("Error en deleteMetaObjetivo:", error);
    return res.status(400).json({
      ok: false,
      mensaje: "Error al dar de baja el registro",
      error: error.message,
    });
  }
};