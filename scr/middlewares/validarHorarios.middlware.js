import { Agenda } from '../models/Agenda.js';

const horaAMinutos = (hora) => {
  if (typeof hora !== 'string' || !hora.includes(':')) return NaN;
  const [horas = 0, minutos = 0] = hora.split(':').map(Number);
  if (Number.isNaN(horas) || Number.isNaN(minutos)) return NaN;
  return horas * 60 + minutos;
};

export const validarHorario = async (req, res, next) => {
  try {
    const { medico, diaSemana, horaInicio, horaFin, duracionTurnoMinutos } = req.body;
    const { id } = req.params;

    if (!horaInicio || !horaFin) {
      return res.status(400).json({
        ok: false,
        mensaje: 'La hora de inicio y la hora de fin son obligatorias',
        data: null
      });
    }

    const inicioNuevo = horaAMinutos(horaInicio);
    const finNuevo = horaAMinutos(horaFin);

    if (Number.isNaN(inicioNuevo) || Number.isNaN(finNuevo)) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El formato de horaInicio o horaFin no es válido (use HH:MM)',
        data: null
      });
    }

    if (finNuevo <= inicioNuevo) {
      return res.status(400).json({
        ok: false,
        mensaje: 'La hora de fin debe ser posterior a la hora de inicio',
        data: null
      });
    }

    const duracion = Number(duracionTurnoMinutos);
    if (!Number.isFinite(duracion) || duracion <= 0) {
      return res.status(400).json({
        ok: false,
        mensaje: 'La duración del turno debe ser un número mayor a 0',
        data: null
      });
    }

    const duracionTotalMinutos = finNuevo - inicioNuevo;
    if (duracionTotalMinutos % duracion !== 0) {
      return res.status(400).json({
        ok: false,
        mensaje: `El rango horario debe ser múltiplo de la duración del turno (${duracion} minutos)`,
        data: null
      });
    }

    const filtroQuery = {
      medico,
      diaSemana,
      activo: true,
    };

    if (id) {
      filtroQuery._id = { $ne: id };
    }

    const horariosExistentes = await Agenda.find(filtroQuery);

    const haySolapamiento = horariosExistentes.some((horario) => {
      const inicioExistente = horaAMinutos(horario.horaInicio);
      const finExistente = horaAMinutos(horario.horaFin);
      if (Number.isNaN(inicioExistente) || Number.isNaN(finExistente)) return false;

      return inicioNuevo < finExistente && finNuevo > inicioExistente;
    });

    if (haySolapamiento) {
      return res.status(409).json({
        ok: false,
        mensaje: 'El rango horario especificado se solapa con otro horario ya asignado para este médico',
        data: null
      });
    }

    return next();
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error interno al verificar la disponibilidad del horario',
      error: error.message
    });
  }
};