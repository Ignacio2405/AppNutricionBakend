import mongoose from 'mongoose';
import { ExcepcionAgenda } from '../models/ExcepcionAgenda.js';
import { TipoExcepcion } from '../enum/ExepcionesTurno.enum.js';

export const crearExcepcionAgenda = async (req, res) => {
  try {
    const { medico, fecha, tipo, horaInicio, horaFin, duracionTurnoMinutos, motivo } = req.body;

    if (tipo === TipoExcepcion.MODIFICACION_HORARIO && (!horaInicio || !horaFin)) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Debe especificar la hora de inicio y fin cuando se trata de una modificación de horario.'
      });
    }

    const nuevaExcepcion = await ExcepcionAgenda.create({
      medico,
      fecha,
      tipo,
      horaInicio: tipo === TipoExcepcion.MODIFICACION_HORARIO ? horaInicio : undefined,
      horaFin: tipo === TipoExcepcion.MODIFICACION_HORARIO ? horaFin : undefined,
      duracionTurnoMinutos: duracionTurnoMinutos || 30,
      motivo,
      activo: true,
    });

    return res.status(201).json({
      ok: true,
      mensaje: 'Excepción de agenda registrada correctamente',
      data: nuevaExcepcion
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        ok: false,
        mensaje: 'Ya existe una excepción activa registrada para este médico en la fecha indicada.'
      });
    }
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al registrar la excepción de agenda',
      error: error.message
    });
  }
};

export const getExcepcionesAgenda = async (req, res) => {
  try {
    const { medico } = req.query;
    const filtro = { activo: true };

    if (medico) {
      filtro.medico = new mongoose.Types.ObjectId(medico);
    }

    const excepciones = await ExcepcionAgenda.find(filtro)
      .populate('medico', 'nombre apellido') 
      .sort({ fecha: 1 });

    return res.status(200).json({
      ok: true,
      mensaje: 'Excepciones de agenda obtenidas exitosamente',
      data: excepciones
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener las excepciones de agenda',
      error: error.message
    });
  }
};

export const desactivarExcepcionAgenda = async (req, res) => {
  try {
    const { id } = req.params;

    const excepcionActualizada = await ExcepcionAgenda.findByIdAndUpdate(
      id,
      { activo: false },
      { new: true }
    );

    if (!excepcionActualizada) {
      return res.status(404).json({
        ok: false,
        mensaje: 'No se encontró la excepción de agenda indicada.'
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: 'Excepción de agenda desactivada correctamente. El médico recupera su horario habitual.',
      data: excepcionActualizada
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al desactivar la excepción de agenda',
      error: error.message
    });
  }
};