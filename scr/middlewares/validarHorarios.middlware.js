import { Agenda } from '../models/Agenda.js';

const horaAMinutos = (hora) => {
  const [horas = 0, minutos = 0] = hora.split(':').map(Number);
  return horas * 60 + minutos;
};

export const validarHorario = async (req, res, next) => {
  try {
    const { medico, diaSemana, horaInicio, horaFin, duracionTurnoMinutos} = req.body;
    const { id } = req.params;

    const inicioNuevo = horaAMinutos(horaInicio);
    const finNuevo = horaAMinutos(horaFin);

    if (finNuevo <= inicioNuevo) {
      return res.status(400).json({
        ok: false,
        mensaje: 'La hora de fin debe ser posterior a la hora de inicio',
        data: null
      });
    }

    // Regla 2: Validar que la duración total sea múltiplo exacto de los turnos (ej: 30 min)
    const duracionTotalMinutos = finNuevo - inicioNuevo;
    if (duracionTotalMinutos % duracionTurnoMinutos !== 0) {
      return res.status(400).json({
        ok: false,
        mensaje: `El rango horario debe ser múltiplo de la duración del turno (${duracionTurnoMinutos} minutos)`,
        data: null
      });
    }
  
    // Regla 3: Construir el filtro para MongoDB
    const filtroQuery = {
      medico,
      diaSemana,
      activo: true,
    };

    // SI VIENE UN ID (PUT/PATCH), EXCLUIMOS ESTE REGISTRO DE LA BÚSQUEDA
    if (id) {
      filtroQuery._id = { $ne: id };
    }

    const horariosExistentes = await Agenda.find(filtroQuery);
    
    // Comprobación de cruce de rangos
    const haySolapamiento = horariosExistentes.some((horario) => {
      const inicioExistente = horaAMinutos(horario.horaInicio);
      const finExistente = horaAMinutos(horario.horaFin);

      // Existe solapamiento si: (NuevoInicio < ExistenteFin) Y (NuevoFin > ExistenteInicio)
      return inicioNuevo < finExistente && finNuevo > inicioExistente;
    });

    if (haySolapamiento) {
      return res.status(409).json({
        ok: false,
        mensaje: 'El rango horario especificado se solapa con otro horario ya asignado para este médico',
        data: null
      });
    }

    // Si todo está bien, pasa al controlador
    return next();
    
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error interno al verificar la disponibilidad del horario',
      error: error.message
    });
  }
};