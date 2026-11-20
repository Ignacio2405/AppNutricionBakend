import { Medico } from '../models/Medico.js';
import { Agenda } from '../models/Agenda.js';
import { DiasSemanasEnum } from '../enum/DiasSemanas.enum.js';

const horaAMinutos = (hora) => {
  const [horas = 0, minutos = 0] = hora.split(':').map(Number);
  return horas * 60 + minutos;
};

const DIAS_MAPA = {
  0: DiasSemanasEnum.DOMINGO,
  1: DiasSemanasEnum.LUNES,
  2: DiasSemanasEnum.MARTES,
  3: DiasSemanasEnum.MIERCOLES,
  4: DiasSemanasEnum.JUEVES,
  5: DiasSemanasEnum.VIERNES,
  6: DiasSemanasEnum.SABADO,
};

export const verificarTurnoValido = async (req, res, next) => {
  try {
    const { medico, fecha, hora } = req.body; // 👈 Quitamos 'especialidad' de aquí

    // 1. VALIDACIÓN DE QUE EL MÉDICO EXISTA
    const medicoEncontrado = await Medico.findById(medico);

    if (!medicoEncontrado) {
      return res.status(404).json({
        ok: false,
        mensaje: 'El médico especificado no existe'
      });
    }

    // 2. OBTENER DÍA DE LA SEMANA CORRECTAMENTE
    const fechaObj = typeof fecha === 'string' ? new Date(`${fecha}T00:00:00Z`) : new Date(fecha);
    const diaNombre = DIAS_MAPA[fechaObj.getUTCDay()];

    if (!diaNombre) {
      return res.status(400).json({
        ok: false,
        mensaje: 'La fecha proporcionada no es válida'
      });
    }

    // 3. BUSCAR TODOS LOS BLOQUES DE AGENDA DEL MÉDICO PARA ESE DÍA
    const horariosAtencion = await Agenda.find({ 
      medico, 
      diaSemana: diaNombre, 
      activo: true 
    });

    if (!horariosAtencion || horariosAtencion.length === 0) {
      return res.status(400).json({
        ok: false,
        mensaje: `El médico no atiende los días ${diaNombre}`
      });
    }

    const bloqueValido = horariosAtencion.find((bloque) => {
      const inicioMin = horaAMinutos(bloque.horaInicio);
      const finMin = horaAMinutos(bloque.horaFin);

      // Debe estar dentro del rango [horaInicio, horaFin)
      if (horaSolicitadaMin < inicioMin || horaSolicitadaMin >= finMin) {
        return false;
      }

      // Debe encajar exactamente en el intervalo de los turnos (ej. cada 30 min)
      const minutosDesdeInicio = horaSolicitadaMin - inicioMin;
      return minutosDesdeInicio % bloque.duracionTurnoMinutos === 0;
    });

    if (!bloqueValido) {
      return res.status(400).json({
        ok: false,
        mensaje: `La hora ${hora} no corresponde a ningún turno disponible del médico para el día ${diaNombre}`
      });
    }

    return next();
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al verificar disponibilidad del turno',
      error: error.message
    });
  }
};