import mongoose from "mongoose";
import { ResultadosLaboratorio } from "../models/ResultadosLaboratorio.js";
import { Paciente } from "../models/Paciente.js"; 
import {
  ejecutarConsultaPaginada,
  obtenerParametrosPaginacion,
} from "../utils/paginacion.js";

// Convierte "", undefined o null en null para campos numéricos opcionales,
// y convierte strings numéricos válidos (ej. "92.5") en Number.
const normalizarNumeroOpcional = (valor) => {
  if (valor === undefined || valor === null || valor === "") {
    return null;
  }
  const numero = Number(valor);
  return Number.isNaN(numero) ? NaN : numero;
};

const construirPayloadLaboratorio = (body, incluirPacienteId = true) => {
  const payload = {};

  if (incluirPacienteId && body.pacienteId !== undefined) {
    payload.pacienteId = body.pacienteId;
  }

  if (body.fechaEstudio !== undefined) {
    payload.fechaEstudio = body.fechaEstudio || Date.now();
  }

  const camposNumericos = [
    "glucemia",
    "colesterolTotal",
    "colesterolHdl",
    "colesterolLdl",
    "trigliceridos",
    "hemoglobinaGlicosilada",
    "tsh",
  ];

  for (const campo of camposNumericos) {
    if (body[campo] !== undefined) {
      payload[campo] = normalizarNumeroOpcional(body[campo]);
    }
  }

  const camposTexto = [
    "observacionesLaboratorio",
    "dietaryRecall24h",
    "notasNutricionista",
  ];

  for (const campo of camposTexto) {
    if (body[campo] !== undefined) {
      payload[campo] =
        body[campo] === null ? "" : String(body[campo]).trim();
    }
  }

  return payload;
};

// CREATE - Crear registro de resultados de laboratorio
export const crearResultadosLaboratorio = async (req, res) => {
  try {
    const { pacienteId } = req.body;

    if (!pacienteId || !mongoose.Types.ObjectId.isValid(pacienteId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID del paciente no es válido.",
      });
    }

    const pacienteExiste = await Paciente.findById(pacienteId);
    if (!pacienteExiste) {
      return res.status(404).json({
        ok: false,
        mensaje: "El paciente indicado no existe.",
      });
    }

    const payload = construirPayloadLaboratorio(req.body, true);

    const nuevoRegistro = new ResultadosLaboratorio(payload);
    const guardado = await nuevoRegistro.save();
    await guardado.populate("pacienteId", "nombre apellido dni");

    return res.status(201).json({
      ok: true,
      mensaje: "Resultados de laboratorio registrados correctamente.",
      data: guardado,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      const mensajes = error.errors
        ? Object.values(error.errors).map((e) => e.message)
        : [error.message];
      return res.status(400).json({
        ok: false,
        mensaje: "Error de validación en los datos enviados.",
        errores: mensajes,
      });
    }

    return res.status(500).json({
      ok: false,
      mensaje: "Error interno al registrar los resultados de laboratorio.",
      error: error.message,
    });
  }
};

// READ ALL - Listar registros activos (opcionalmente filtrados por pacienteId)
export const obtenerResultadosLaboratorio = async (req, res) => {
  try {
    const { pacienteId } = req.query;
    const filtro = { activo: true };
    const paginacion = obtenerParametrosPaginacion(req.query);
    if (!paginacion) {
      return res.status(400).json({
        ok: false,
        mensaje: "Los parámetros page y limit deben ser enteros positivos.",
      });
    }

    if (pacienteId) {
      if (!mongoose.Types.ObjectId.isValid(pacienteId)) {
        return res.status(400).json({
          ok: false,
          mensaje: "El ID del paciente en la consulta no es válido.",
        });
      }
      filtro.pacienteId = pacienteId;
    }

    const { data: lista, pagination } = await ejecutarConsultaPaginada(
      ResultadosLaboratorio.find(filtro)
        .populate("pacienteId", "nombre apellido dni")
        .sort({ fechaEstudio: -1, createdAt: -1, _id: -1 }),
      ResultadosLaboratorio,
      filtro,
      paginacion,
    );

    return res.status(200).json({
      ok: true,
      total: pagination.total,
      data: lista,
      pagination,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener los resultados de laboratorio.",
      error: error.message,
    });
  }
};

// READ ONE - Obtener un registro por ID
export const obtenerResultadosLaboratorioPorId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID proporcionado no es válido.",
      });
    }

    const registro = await ResultadosLaboratorio.findOne({
      _id: id,
      activo: true,
    }).populate("pacienteId", "nombre apellido dni");

    if (!registro) {
      return res.status(404).json({
        ok: false,
        mensaje: "Registro de resultados de laboratorio no encontrado.",
      });
    }

    return res.status(200).json({
      ok: true,
      data: registro,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener el registro de resultados de laboratorio.",
      error: error.message,
    });
  }
};

// UPDATE - Actualizar un registro por ID
export const actualizarResultadosLaboratorio = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID proporcionado no es válido.",
      });
    }

    const datosActualizar = construirPayloadLaboratorio(req.body, true);

    if (datosActualizar.pacienteId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(datosActualizar.pacienteId)) {
        return res.status(400).json({
          ok: false,
          mensaje: "El ID del paciente no es válido.",
        });
      }
      const pacienteExiste = await Paciente.findById(datosActualizar.pacienteId);
      if (!pacienteExiste) {
        return res.status(404).json({
          ok: false,
          mensaje: "El paciente indicado no existe.",
        });
      }
    }

    const actualizado = await ResultadosLaboratorio.findOneAndUpdate(
      { _id: id, activo: true },
      datosActualizar,
      { new: true, runValidators: true }
    ).populate("pacienteId", "nombre apellido dni");

    if (!actualizado) {
      return res.status(404).json({
        ok: false,
        mensaje: "Registro de resultados de laboratorio no encontrado.",
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: "Resultados de laboratorio actualizados correctamente.",
      data: actualizado,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      const mensajes = error.errors
        ? Object.values(error.errors).map((e) => e.message)
        : [error.message];
      return res.status(400).json({
        ok: false,
        mensaje: "Error de validación al actualizar.",
        errores: mensajes,
      });
    }

    return res.status(500).json({
      ok: false,
      mensaje: "Error al actualizar los resultados de laboratorio.",
      error: error.message,
    });
  }
};

// DELETE (Lógico) - Desactivar un registro por ID
export const eliminarResultadosLaboratorio = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID proporcionado no es válido.",
      });
    }

    const desactivado = await ResultadosLaboratorio.findOneAndUpdate(
      { _id: id, activo: true },
      { activo: false },
      { new: true }
    );

    if (!desactivado) {
      return res.status(404).json({
        ok: false,
        mensaje:
          "Registro de resultados de laboratorio no encontrado o ya eliminado.",
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: "Resultados de laboratorio desactivados correctamente.",
      data: desactivado,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: "Error al desactivar los resultados de laboratorio.",
      error: error.message,
    });
  }
};