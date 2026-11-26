import mongoose from "mongoose";
import { HabitosAlimentarios } from "../models/HabitosAlimentarios.js";
import { Paciente } from "../models/Paciente.js"; // Ajustá el nombre/ruta si tu modelo se llama distinto
import {
  ejecutarConsultaPaginada,
  obtenerParametrosPaginacion,
} from "../utils/paginacion.js";

// Helper para normalizar listas de alimentos si vienen como string separado por comas o como array
const normalizarLista = (valor) => {
  if (Array.isArray(valor)) {
    return valor.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof valor === "string") {
    return valor
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

// CREATE - Crear registro de hábitos alimentarios
export const crearHabitosAlimentarios = async (req, res) => {
  try {
    const {
      pacienteId,
      cantidadComidasDiarias,
      consumoAguaDiarioLitros,
      alimentosPreferidos,
      alimentosRechazados,
      historialDietasPrevias,
      resultadosDietasPrevias,
      nivelActividadFisica,
      horasSuenoNocturno,
      nivelEstres,
    } = req.body;

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

    const nuevoRegistro = new HabitosAlimentarios({
      pacienteId,
      cantidadComidasDiarias,
      consumoAguaDiarioLitros,
      alimentosPreferidos: normalizarLista(alimentosPreferidos),
      alimentosRechazados: normalizarLista(alimentosRechazados),
      historialDietasPrevias,
      resultadosDietasPrevias,
      nivelActividadFisica,
      horasSuenoNocturno,
      nivelEstres,
    });

    const guardado = await nuevoRegistro.save();
    await guardado.populate("pacienteId", "nombre apellido dni");

    return res.status(201).json({
      ok: true,
      mensaje: "Hábitos alimentarios registrados correctamente.",
      data: guardado,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const mensajes = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        ok: false,
        mensaje: "Error de validación en los datos enviados.",
        errores: mensajes,
      });
    }

    return res.status(500).json({
      ok: false,
      mensaje: "Error interno al registrar los hábitos alimentarios.",
      error: error.message,
    });
  }
};

// READ ALL - Listar todos los registros activos (opcionalmente filtrados por pacienteId)
export const obtenerHabitosAlimentarios = async (req, res) => {
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
      HabitosAlimentarios.find(filtro)
        .populate("pacienteId", "nombre apellido dni")
        .sort({ createdAt: -1, _id: -1 }),
      HabitosAlimentarios,
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
      mensaje: "Error al obtener los hábitos alimentarios.",
      error: error.message,
    });
  }
};

// READ ONE - Obtener un registro por ID
export const obtenerHabitosAlimentariosPorId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID proporcionado no es válido.",
      });
    }

    const registro = await HabitosAlimentarios.findOne({
      _id: id,
      activo: true,
    }).populate("pacienteId", "nombre apellido dni");

    if (!registro) {
      return res.status(404).json({
        ok: false,
        mensaje: "Registro de hábitos alimentarios no encontrado.",
      });
    }

    return res.status(200).json({
      ok: true,
      data: registro,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener el registro de hábitos alimentarios.",
      error: error.message,
    });
  }
};

// UPDATE - Actualizar un registro por ID
export const actualizarHabitosAlimentarios = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID proporcionado no es válido.",
      });
    }

    const datosActualizar = { ...req.body };

    // Evitamos que modifiquen el estado lógico por esta vía si no corresponde
    delete datosActualizar._id;
    delete datosActualizar.activo;

    if (datosActualizar.pacienteId) {
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

    if (datosActualizar.alimentosPreferidos !== undefined) {
      datosActualizar.alimentosPreferidos = normalizarLista(
        datosActualizar.alimentosPreferidos
      );
    }

    if (datosActualizar.alimentosRechazados !== undefined) {
      datosActualizar.alimentosRechazados = normalizarLista(
        datosActualizar.alimentosRechazados
      );
    }

    const actualizado = await HabitosAlimentarios.findOneAndUpdate(
      { _id: id, activo: true },
      datosActualizar,
      { new: true, runValidators: true }
    ).populate("pacienteId", "nombre apellido dni");

    if (!actualizado) {
      return res.status(404).json({
        ok: false,
        mensaje: "Registro de hábitos alimentarios no encontrado.",
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: "Hábitos alimentarios actualizados correctamente.",
      data: actualizado,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const mensajes = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        ok: false,
        mensaje: "Error de validación al actualizar.",
        errores: mensajes,
      });
    }

    return res.status(500).json({
      ok: false,
      mensaje: "Error al actualizar los hábitos alimentarios.",
      error: error.message,
    });
  }
};

// DELETE (Lógico) - Desactivar un registro por ID
export const eliminarHabitosAlimentarios = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID proporcionado no es válido.",
      });
    }

    const desactivado = await HabitosAlimentarios.findOneAndUpdate(
      { _id: id, activo: true },
      { activo: false },
      { new: true }
    );

    if (!desactivado) {
      return res.status(404).json({
        ok: false,
        mensaje: "Registro de hábitos alimentarios no encontrado o ya eliminado.",
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: "Hábitos alimentarios desactivados correctamente.",
      data: desactivado,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: "Error al desactivar los hábitos alimentarios.",
      error: error.message,
    });
  }
};