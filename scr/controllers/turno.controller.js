import { EstadoTurnoEnum } from '../enum/EstadoTurno.enum.js';
import { Turno } from '../models/Turno.js';
import { DiasSemanasEnum } from '../enum/DiasSemanas.enum.js';
import { Agenda } from '../models/Agenda.js';
import { ExcepcionAgenda } from '../models/ExcepcionAgenda.js';
import { TipoExcepcion } from '../enum/ExepcionesTurno.enum.js';
import mongoose from 'mongoose';
import { Paciente } from '../models/Paciente.js';
import { Medico } from '../models/Medico.js';
import { ConsultaMedica } from '../models/Consulta.js';
import { RolEnum } from '../enum/Rol.enum.js';

const DIAS_MAPA = {
  0: DiasSemanasEnum.DOMINGO,
  1: DiasSemanasEnum.LUNES,
  2: DiasSemanasEnum.MARTES,
  3: DiasSemanasEnum.MIERCOLES,
  4: DiasSemanasEnum.JUEVES,
  5: DiasSemanasEnum.VIERNES,
  6: DiasSemanasEnum.SABADO,
};

const obtenerFechaHoyStr = () => {
  const hoyObj = new Date();
  const anio = hoyObj.getFullYear();
  const mes = String(hoyObj.getMonth() + 1).padStart(2, '0');
  const dia = String(hoyObj.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

const generarSlots = (horaInicio, horaFin, duracionMinutos) => {
  const slots = [];
  const [hInicio = 0, mInicio = 0] = horaInicio.split(':').map(Number);
  const [hFin = 0, mFin = 0] = horaFin.split(':').map(Number);

  let minutosActuales = hInicio * 60 + mInicio;
  const minutosFin = hFin * 60 + mFin;

  while (minutosActuales < minutosFin) {
    const horaStr = String(Math.floor(minutosActuales / 60)).padStart(2, '0');
    const minStr = String(minutosActuales % 60).padStart(2, '0');
    slots.push(`${horaStr}:${minStr}`);
    minutosActuales += duracionMinutos;
  }
  return slots;
};

const buscarPacientePorUsuario = async (usuario) => {
  if (!usuario) return null;
  const usuarioId = usuario.id || usuario._id;
  const emailNormalizado = String(usuario.email || '').toLowerCase().trim();

  const condiciones = [];
  if (usuarioId && mongoose.Types.ObjectId.isValid(usuarioId)) {
    condiciones.push({ usuario: new mongoose.Types.ObjectId(usuarioId) });
  }
  if (emailNormalizado) {
    condiciones.push({ email: emailNormalizado });
  }
  if (condiciones.length === 0) return null;

  return Paciente.findOne({ $or: condiciones }).lean();
};

const buscarMedicoPorUsuario = async (usuario) => {
  if (!usuario) return null;
  const usuarioId = usuario.id || usuario._id;
  const emailNormalizado = String(usuario.email || '').toLowerCase().trim();

  const filtroActivo = {
    $or: [{ activo: true }, { activo: { $exists: false } }],
  };
  if (usuarioId && mongoose.Types.ObjectId.isValid(usuarioId)) {
    const medicoVinculado = await Medico.findOne({
      usuario: new mongoose.Types.ObjectId(usuarioId),
      ...filtroActivo,
    }).lean();
    if (medicoVinculado) return medicoVinculado;
  }
  return emailNormalizado
    ? Medico.findOne({ email: emailNormalizado, ...filtroActivo }).lean()
    : null;
};

const obtenerFiltroPorUsuario = async (usuario) => {
  const rolUsuario = String(usuario?.rol || '').toUpperCase();

  if (rolUsuario === RolEnum.PACIENTE) {
    const pacienteDoc = await buscarPacientePorUsuario(usuario);
    return pacienteDoc ? { paciente: pacienteDoc._id } : null;
  }

  if (rolUsuario === RolEnum.MEDICO) {
    const medicoDoc = await buscarMedicoPorUsuario(usuario);
    return medicoDoc ? { medico: medicoDoc._id } : null;
  }

  if ([RolEnum.ADMIN, RolEnum.RECEPCIONISTA].includes(rolUsuario)) return {};
  return null;
};

export const getTurnos = async (req, res) => {
  try {
    const { id, medico, fecha } = req.query;
    const usuario = req.usuario || req.user;
    const alcance = await obtenerFiltroPorUsuario(usuario);
    if (!alcance) {
      return res.status(200).json({
        ok: true,
        mensaje: 'No se encontró un perfil asociado a tu usuario',
        data: [],
      });
    }

    const filtro = { ...alcance, activo: true };

    if (!Object.keys(alcance).length && medico && mongoose.Types.ObjectId.isValid(medico)) {
      filtro.medico = new mongoose.Types.ObjectId(medico);
    }

    if (id && !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El ID del turno no es válido',
      });
    }

    if (id) {
      filtro._id = new mongoose.Types.ObjectId(id);
    }

    if (fecha) {
      const inicioDia = new Date(`${fecha}T00:00:00.000Z`);
      const finDia = new Date(`${fecha}T23:59:59.999Z`);
      filtro.fecha = { $gte: inicioDia, $lte: finDia };
    }

    const pacientePopulate = {
      path: 'paciente',
      select: 'nombre apellido obraSocial',
      populate: {
        path: 'obraSocial',
        select: 'razonSocial',
      },
    };

    const turnos = await Turno.find(filtro)
      .populate(pacientePopulate)
      .populate('medico', 'nombre apellido')
      .sort({ fecha: 1, hora: 1 });

    return res.status(200).json({
      ok: true,
      mensaje: 'Turnos obtenidos exitosamente',
      data: turnos,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error interno del servidor',
      error: error.message,
    });
  }
};

export const getTurnoById = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = req.usuario || req.user;
    const alcance = await obtenerFiltroPorUsuario(usuario);
    if (!alcance) {
      return res.status(403).json({
        ok: false,
        mensaje: 'No se encontró un perfil asociado a tu usuario',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El ID del turno no es válido',
      });
    }

    const pacientePopulate = {
      path: 'paciente',
      select: 'nombre apellido obraSocial',
      populate: {
        path: 'obraSocial',
        select: 'razonSocial',
      },
    };

    const turno = await Turno.findOne({ _id: id, ...alcance })
      .populate(pacientePopulate)
      .populate('medico', 'nombre apellido');

    if (!turno) {
      return res.status(404).json({
        ok: false,
        mensaje: `Turno no encontrado con ID ${id}`,
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: 'Turno obtenido exitosamente',
      data: turno,
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      mensaje: 'ID con formato inválido',
      error: error.message,
    });
  }
};

export const getTurnosDisponibles = async (req, res) => {
  try {
    let { medico, fecha } = req.query;
    const usuario = req.usuario || req.user;
    if (String(usuario?.rol || '').toUpperCase() === RolEnum.MEDICO) {
      const medicoDoc = await buscarMedicoPorUsuario(usuario);
      if (!medicoDoc) {
        return res.status(403).json({
          ok: false,
          mensaje: 'No se encontró un perfil médico asociado a tu usuario',
        });
      }
      medico = String(medicoDoc._id);
    }

    if (!medico || !fecha) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El ID del médico y la fecha son obligatorios',
        data: null,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(medico)) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El ID del médico no es válido',
      });
    }

    const fechaObjTurno = new Date(fecha);

    if (isNaN(fechaObjTurno.getTime())) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El formato de la fecha no es válido.',
      });
    }

    const anioT = fechaObjTurno.getUTCFullYear();
    const mesT = String(fechaObjTurno.getUTCMonth() + 1).padStart(2, '0');
    const diaT = String(fechaObjTurno.getUTCDate()).padStart(2, '0');

    const fechaTurnoStr = `${anioT}-${mesT}-${diaT}`;
    const hoyStr = obtenerFechaHoyStr();

    if (fechaTurnoStr < hoyStr) {
      return res.status(400).json({
        ok: false,
        mensaje: 'No se pueden consultar disponibilidades de fechas pasadas.',
      });
    }

    const inicioDia = new Date(`${fechaTurnoStr}T00:00:00.000Z`);
    const finDia = new Date(`${fechaTurnoStr}T23:59:59.999Z`);

    const fechaObj = new Date(`${fechaTurnoStr}T00:00:00Z`);
    const diaNombre = DIAS_MAPA[fechaObj.getUTCDay()];

    if (!diaNombre) {
      return res.status(400).json({
        ok: false,
        mensaje: 'La fecha proporcionada no es válida',
        data: null,
      });
    }

    // 1. Verificar excepciones de agenda
    const excepcionDia = await ExcepcionAgenda.findOne({
      medico,
      fecha: { $gte: inicioDia, $lte: finDia },
      activo: true,
    });

    let todosLosSlots = [];
    let duracionTurno = 30;

    if (excepcionDia) {
      const motivoExcepcion = excepcionDia.motivo || '';

      if (excepcionDia.tipo === TipoExcepcion.BLOQUEO_TOTAL) {
        return res.status(200).json({
          ok: true,
          mensaje: `El médico no atiende este día: ${motivoExcepcion}`,
          data: {
            fecha: fechaTurnoStr,
            horariosDisponibles: [],
          },
        });
      } else if (
        excepcionDia.tipo === TipoExcepcion.MODIFICACION_HORARIO &&
        excepcionDia.horaInicio &&
        excepcionDia.horaFin
      ) {
        duracionTurno = excepcionDia.duracionTurnoMinutos || 30;
        todosLosSlots = generarSlots(
          excepcionDia.horaInicio,
          excepcionDia.horaFin,
          duracionTurno,
        );
      }
    } else {
      const horariosAtencion = await Agenda.find({
        medico: new mongoose.Types.ObjectId(medico),
        diaSemana: diaNombre,
        activo: true,
      });

      if (!horariosAtencion || horariosAtencion.length === 0) {
        return res.status(200).json({
          ok: true,
          mensaje: 'El médico no atiende en el día seleccionado',
          data: {
            horariosDisponibles: [],
          },
        });
      }

      horariosAtencion.forEach((bloque) => {
        duracionTurno = bloque.duracionTurnoMinutos;
        const slotsBloque = generarSlots(
          bloque.horaInicio,
          bloque.horaFin,
          bloque.duracionTurnoMinutos,
        );
        todosLosSlots = todosLosSlots.concat(slotsBloque);
      });
    }

    // 2. Buscar turnos ocupados
    const turnosOcupados = await Turno.find({
      medico: new mongoose.Types.ObjectId(medico),
      fecha: { $gte: inicioDia, $lte: finDia },
      activo: true,
      estado: { $ne: EstadoTurnoEnum.CANCELADO },
    });

    const horasOcupadas = turnosOcupados.map((t) => t.hora);
    const horariosLibres = todosLosSlots.filter(
      (slot) => !horasOcupadas.includes(slot),
    );

    return res.status(200).json({
      ok: true,
      mensaje: 'Disponibilidad obtenida exitosamente',
      data: {
        fecha: fechaTurnoStr,
        diaSemana: diaNombre,
        duracionTurnoMinutos: duracionTurno,
        todosLosSlots,
        horariosDisponibles: horariosLibres,
      },
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al calcular los turnos disponibles',
      error: error.message,
    });
  }
};

export const getDisponibilidadMes = async (req, res) => {
  try {
    let { medico, anio, mes } = req.query;
    const usuario = req.usuario || req.user;
    if (String(usuario?.rol || '').toUpperCase() === RolEnum.MEDICO) {
      const medicoDoc = await buscarMedicoPorUsuario(usuario);
      if (!medicoDoc) {
        return res.status(403).json({
          ok: false,
          mensaje: 'No se encontró un perfil médico asociado a tu usuario',
        });
      }
      medico = String(medicoDoc._id);
    }

    if (!medico || !anio || !mes) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Faltan parámetros obligatorios (medico, anio, mes)',
        data: null,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(medico)) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El ID del médico no es válido',
      });
    }

    const anioNum = parseInt(anio, 10);
    const mesNum = parseInt(mes, 10);

    if (isNaN(anioNum) || isNaN(mesNum) || mesNum < 1 || mesNum > 12) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Año o mes con formato inválido',
        data: null,
      });
    }

    const totalDias = new Date(anioNum, mesNum, 0).getDate();
    const diasDisponibilidad = [];

    const horariosAtencion = await Agenda.find({
      medico: new mongoose.Types.ObjectId(medico),
      activo: true,
    });
    const hoyStr = obtenerFechaHoyStr();

    for (let dia = 1; dia <= totalDias; dia++) {
      const mesStr = String(mesNum).padStart(2, '0');
      const diaStr = String(dia).padStart(2, '0');
      const fechaStr = `${anioNum}-${mesStr}-${diaStr}`;

      if (fechaStr < hoyStr) {
        diasDisponibilidad.push({
          fecha: fechaStr,
          diaNum: dia,
          tieneDisponibilidad: false,
          totalLibres: 0,
        });
        continue;
      }

      const inicioDia = new Date(`${fechaStr}T00:00:00.000Z`);
      const finDia = new Date(`${fechaStr}T23:59:59.999Z`);

      const fechaObj = new Date(`${fechaStr}T00:00:00Z`);
      const diaNombre = DIAS_MAPA[fechaObj.getUTCDay()];

      const excepcionDia = await ExcepcionAgenda.findOne({
        medico,
        fecha: { $gte: inicioDia, $lte: finDia },
        activo: true,
      });

      let slotsTeoricos = [];

      if (excepcionDia) {
        if (excepcionDia.tipo === TipoExcepcion.BLOQUEO_TOTAL) {
          diasDisponibilidad.push({
            fecha: fechaStr,
            diaNum: dia,
            tieneDisponibilidad: false,
            totalLibres: 0,
          });
          continue;
        } else if (
          excepcionDia.tipo === TipoExcepcion.MODIFICACION_HORARIO &&
          excepcionDia.horaInicio &&
          excepcionDia.horaFin
        ) {
          const duracion = excepcionDia.duracionTurnoMinutos || 30;
          slotsTeoricos = generarSlots(
            excepcionDia.horaInicio,
            excepcionDia.horaFin,
            duracion,
          );
        }
      } else {
        const bloquesDia = horariosAtencion.filter(
          (h) => h.diaSemana === diaNombre,
        );
        bloquesDia.forEach((bloque) => {
          const slotsBloque = generarSlots(
            bloque.horaInicio,
            bloque.horaFin,
            bloque.duracionTurnoMinutos,
          );
          slotsTeoricos = slotsTeoricos.concat(slotsBloque);
        });
      }

      if (slotsTeoricos.length === 0) {
        diasDisponibilidad.push({
          fecha: fechaStr,
          diaNum: dia,
          tieneDisponibilidad: false,
          totalLibres: 0,
        });
        continue;
      }

      const turnosOcupados = await Turno.find({
        medico: new mongoose.Types.ObjectId(medico),
        fecha: { $gte: inicioDia, $lte: finDia },
        activo: true,
        estado: { $ne: EstadoTurnoEnum.CANCELADO },
      });

      const horasOcupadas = turnosOcupados.map((t) => t.hora);
      const slotsLibres = slotsTeoricos.filter(
        (slot) => !horasOcupadas.includes(slot),
      );

      diasDisponibilidad.push({
        fecha: fechaStr,
        diaNum: dia,
        tieneDisponibilidad: slotsLibres.length > 0,
        totalLibres: slotsLibres.length,
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: 'Disponibilidad mensual obtenida exitosamente',
      data: diasDisponibilidad,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al calcular la disponibilidad mensual',
      error: error.message,
    });
  }
};

export const createTurno = async (req, res) => {
  try {
    const esUrgente = req.query.urgencia === 'true';
    const usuario = req.usuario || req.user;
    const rolUsuario = String(usuario?.rol || '').toUpperCase();
    const datosDelTurno = { ...req.body };
    if (rolUsuario === RolEnum.PACIENTE) {
      const pacienteDoc = await buscarPacientePorUsuario(usuario);
      if (!pacienteDoc) {
        return res.status(403).json({
          ok: false,
          mensaje: 'No se encontró la ficha de paciente asociada a tu usuario',
        });
      }
      datosDelTurno.paciente = pacienteDoc._id;
    } else if (rolUsuario === RolEnum.MEDICO) {
      const medicoDoc = await buscarMedicoPorUsuario(usuario);
      if (!medicoDoc) {
        return res.status(403).json({
          ok: false,
          mensaje: 'No se encontró un perfil médico asociado a tu usuario',
        });
      }
      datosDelTurno.medico = medicoDoc._id;
    }

    const { fecha, paciente } = datosDelTurno;
    const observaciones = (req.body.observaciones || '').trim();

    if (
      !fecha ||
      !paciente ||
      !datosDelTurno.medico ||
      !mongoose.Types.ObjectId.isValid(paciente) ||
      !mongoose.Types.ObjectId.isValid(datosDelTurno.medico)
    ) {
      return res.status(400).json({
        ok: false,
        mensaje:
          'La fecha, el médico y el paciente son obligatorios para registrar un turno.',
      });
    }

    const turnosCanceladosCount = await Turno.countDocuments({
      paciente,
      estado: EstadoTurnoEnum.CANCELADO,
      activo: false,
    });

    if (turnosCanceladosCount > 3) {
      const ultimoTurnoCancelado = await Turno.findOne({
        paciente,
        estado: EstadoTurnoEnum.CANCELADO,
      }).sort({ _id: -1 });

      if (ultimoTurnoCancelado) {
        const fechaCancelacion = new Date(
          ultimoTurnoCancelado._id.getTimestamp() ||
            ultimoTurnoCancelado.fecha,
        );
        const diasPenalizacion = 15;
        const fechaFinSancion = new Date(fechaCancelacion);
        fechaFinSancion.setDate(fechaFinSancion.getDate() + diasPenalizacion);

        const hoy = new Date();

        if (hoy < fechaFinSancion) {
          const diasRestantes = Math.ceil(
            (fechaFinSancion.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24),
          );
          return res.status(403).json({
            ok: false,
            mensaje: `Acción bloqueada: El paciente registra múltiples cancelaciones. No podrá solicitar nuevos turnos por ${diasRestantes} días más.`,
          });
        }
      }
    }

    const fechaObjTurno = new Date(fecha);

    if (isNaN(fechaObjTurno.getTime())) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El formato de la fecha no es válido.',
      });
    }

    const anioT = fechaObjTurno.getUTCFullYear();
    const mesT = String(fechaObjTurno.getUTCMonth() + 1).padStart(2, '0');
    const diaT = String(fechaObjTurno.getUTCDate()).padStart(2, '0');
    const fechaTurnoStr = `${anioT}-${mesT}-${diaT}`;

    const hoyStr = obtenerFechaHoyStr();

    if (fechaTurnoStr < hoyStr) {
      return res.status(400).json({
        ok: false,
        mensaje:
          'No se pueden registrar turnos con fechas anteriores al día de hoy.',
      });
    }

    const fechaNormalizada = new Date(`${fechaTurnoStr}T00:00:00.000Z`);
    const datosNormalizados = {
      ...datosDelTurno,
      fecha: fechaNormalizada,
      estado: esUrgente ? EstadoTurnoEnum.ATENDIDO : EstadoTurnoEnum.PENDIENTE,
      observaciones:
        observaciones || (esUrgente ? 'Ingreso por guardia médica' : ''),
    };

    const nuevoTurno = await Turno.create(datosNormalizados);
    return res.status(201).json({
      ok: true,
      mensaje: 'Turno creado exitosamente',
      data: nuevoTurno,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        ok: false,
        mensaje:
          'El paciente ya tiene asignado un turno en la misma fecha y hora',
        data: null,
      });
    }
    return res.status(500).json({
      ok: false,
      mensaje: 'Error interno del servidor',
      error: error.message,
    });
  }
};

export const updateTurno = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = req.usuario || req.user;
    const rolUsuario = String(usuario?.rol || '').toUpperCase();
    const alcance = await obtenerFiltroPorUsuario(usuario);
    if (!alcance) {
      return res.status(403).json({
        ok: false,
        mensaje: 'No se encontró un perfil asociado a tu usuario',
      });
    }

    const turnoExistente = await Turno.findOne({ _id: id, ...alcance });

    if (!turnoExistente) {
      return res.status(Object.keys(alcance).length ? 403 : 404).json({
        ok: false,
        mensaje: Object.keys(alcance).length
          ? 'No tenés permiso para modificar este turno'
          : `Turno no encontrado con ID ${id}`,
      });
    }

    const datosActualizacion = { ...req.body };
    if (rolUsuario === RolEnum.MEDICO || rolUsuario === RolEnum.PACIENTE) {
      if (Object.keys(datosActualizacion).some((key) => key.startsWith('$'))) {
        return res.status(400).json({
          ok: false,
          mensaje: 'No se permiten operadores de actualización en la solicitud',
        });
      }
      delete datosActualizacion.paciente;
      delete datosActualizacion.medico;
    }

    if (turnoExistente.estado === EstadoTurnoEnum.ATENDIDO) {
      return res.status(400).json({
        ok: false,
        mensaje:
          'No se puede modificar este turno porque ya se encuentra en estado ATENDIDO.',
      });
    }

    const pacientePopulate = {
      path: 'paciente',
      select: 'nombre apellido obraSocial',
      populate: {
        path: 'obraSocial',
        select: 'razonSocial',
      },
    };

    const turnoActualizado = await Turno.findOneAndUpdate(
      { _id: id, ...alcance },
      datosActualizacion,
      { new: true, runValidators: true },
    )
      .populate(pacientePopulate)
      .populate('medico', 'nombre apellido');

    return res.status(200).json({
      ok: true,
      mensaje: 'Turno actualizado exitosamente',
      data: turnoActualizado,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        ok: false,
        mensaje:
          'El médico ya tiene asignado un turno en la misma fecha y hora',
        data: null,
      });
    }

    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        ok: false,
        mensaje: 'Error de validación',
        error: errores,
      });
    }

    return res.status(500).json({
      ok: false,
      mensaje: 'Error interno del servidor',
      error: error.message,
    });
  }
};

export const deleteTurno = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = req.usuario || req.user;
    const alcance = await obtenerFiltroPorUsuario(usuario);
    if (!alcance) {
      return res.status(403).json({
        ok: false,
        mensaje: 'No se encontró un perfil asociado a tu usuario',
      });
    }

    const turnoBorrado = await Turno.findOneAndUpdate(
      { _id: id, ...alcance },
      { activo: false, estado: EstadoTurnoEnum.CANCELADO },
      { new: true },
    );

    if (!turnoBorrado) {
      return res.status(Object.keys(alcance).length ? 403 : 404).json({
        ok: false,
        mensaje: Object.keys(alcance).length
          ? 'No tenés permiso para eliminar este turno'
          : `Turno no encontrado con ID ${id}`,
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: 'Turno eliminado exitosamente',
      data: turnoBorrado,
    });
  } catch (error) {
    console.error('Error al eliminar el turno:', error);
    return res.status(400).json({
      ok: false,
      mensaje: 'ID con formato inválido',
      error: error.message,
    });
  }
};

export const marcarAtendido = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = req.usuario || req.user;
    const alcance = await obtenerFiltroPorUsuario(usuario);
    if (!alcance) {
      return res.status(403).json({
        ok: false,
        mensaje: 'No se encontró un perfil asociado a tu usuario',
      });
    }
    const turno = await Turno.findOne({ _id: id, ...alcance });

    if (!turno) {
      return res.status(Object.keys(alcance).length ? 403 : 404).json({
        ok: false,
        mensaje: Object.keys(alcance).length
          ? 'No tenés permiso para atender este turno'
          : `Turno no encontrado con ID ${id}`,
      });
    }

    if (turno.estado === EstadoTurnoEnum.ATENDIDO) {
      return res.status(400).json({
        ok: false,
        mensaje:
          'Este turno ya se encuentra marcado como atendido y no puede modificarse.',
      });
    }

    const fechaTurnoIso = new Date(turno.fecha).toISOString();
    const fechaTurnoStr = fechaTurnoIso.split('T')[0];

    const hoyObj = new Date();
    const anio = hoyObj.getFullYear();
    const mes = String(hoyObj.getMonth() + 1).padStart(2, '0');
    const dia = String(hoyObj.getDate()).padStart(2, '0');
    const hoyStr = `${anio}-${mes}-${dia}`;

    if (fechaTurnoStr !== hoyStr) {
      return res.status(400).json({
        ok: false,
        mensaje:
          'Acción no permitida: Solo se pueden atender turnos programados para el día de la fecha.',
      });
    }

    turno.estado = EstadoTurnoEnum.ATENDIDO;
    await turno.save();

    return res.status(200).json({
      ok: true,
      mensaje: 'Turno marcado como atendido exitosamente',
      data: turno,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error de servidor',
      error: error.message,
    });
  }
};

export const getTurnosPendientesHistoricos = async (req, res) => {
  try {
    const hoyStr = obtenerFechaHoyStr();
    const finHoy = new Date(`${hoyStr}T23:59:59.999Z`);

    const pacientePopulate = {
      path: 'paciente',
      select: 'nombre apellido obraSocial dni telefono',
      populate: {
        path: 'obraSocial',
        select: 'razonSocial',
      },
    };

    const alcance = await obtenerFiltroPorUsuario(req.usuario || req.user);
    if (!alcance) {
      return res.status(200).json({
        ok: true,
        mensaje: 'No se encontró un perfil asociado a tu usuario',
        data: [],
      });
    }

    const turnosHistoricos = await Turno.find({
      ...alcance,
      fecha: { $lte: finHoy },
      activo: true,
      estado: {
        $nin: [EstadoTurnoEnum.ATENDIDO, EstadoTurnoEnum.CANCELADO],
      },
    })
      .populate(pacientePopulate)
      .populate('medico', 'nombre apellido')
      .sort({ fecha: -1, hora: -1 });

    return res.status(200).json({
      ok: true,
      mensaje: 'Turnos pendientes históricos obtenidos exitosamente',
      data: turnosHistoricos,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener los turnos pendientes históricos',
      error: error.message,
    });
  }
};

export const cancelarTurno = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = req.usuario || req.user;
    const alcance = await obtenerFiltroPorUsuario(usuario);
    if (!alcance) {
      return res.status(403).json({
        ok: false,
        mensaje: 'No se encontró un perfil asociado a tu usuario',
      });
    }

    const turno = await Turno.findOne({ _id: id, ...alcance });

    if (!turno) {
      return res.status(Object.keys(alcance).length ? 403 : 404).json({
        ok: false,
        mensaje: Object.keys(alcance).length
          ? 'No tenés permiso para cancelar este turno'
          : `Turno no encontrado con ID ${id}`,
      });
    }

    if (turno.estado === EstadoTurnoEnum.ATENDIDO) {
      return res.status(400).json({
        ok: false,
        mensaje: 'No se puede cancelar un turno que ya ha sido atendido.',
      });
    }

    if (turno.estado === EstadoTurnoEnum.CANCELADO) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Este turno ya se encuentra cancelado.',
      });
    }

    turno.estado = EstadoTurnoEnum.CANCELADO;
    turno.activo = false;
    await turno.save();

    return res.status(200).json({
      ok: true,
      mensaje: 'Turno cancelado exitosamente',
      data: turno,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al cancelar el turno',
      error: error.message,
    });
  }
};

export const getMisTurnos = async (req, res) => {
  try {
    const usuario = req.usuario || req.user;
    const alcance = await obtenerFiltroPorUsuario(usuario);
    if (!alcance) {
      return res.status(404).json({
        ok: false,
        mensaje: 'No se encontró un perfil asociado a tu usuario',
      });
    }

    const filtro = { ...alcance, activo: true };

    if (req.query.historial !== 'true') {
      const limite = new Date();
      limite.setDate(limite.getDate() - 30);
      limite.setHours(0, 0, 0, 0);
      filtro.fecha = { $gte: limite };
    }

    const turnos = await Turno.find(filtro)
      .populate('medico', 'nombre apellido')
      .sort({ fecha: 1, hora: 1 });

    return res.status(200).json({
      ok: true,
      mensaje: 'Turnos obtenidos exitosamente',
      data: turnos,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener los turnos',
      error: error.message,
    });
  }
};

export const getMiTurnoById = async (req, res) => {
  try {
    const usuario = req.usuario || req.user;
    const alcance = await obtenerFiltroPorUsuario(usuario);
    if (!alcance) {
      return res.status(404).json({
        ok: false,
        mensaje: 'No se encontró un perfil asociado a tu usuario',
      });
    }

    const turno = await Turno.findOne({ _id: req.params.id, ...alcance })
      .populate('paciente', 'nombre apellido')
      .populate('medico', 'nombre apellido');

    if (!turno) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Turno no encontrado',
      });
    }

    const consulta = await ConsultaMedica.findOne({
      turno: turno._id,
      paciente: turno.paciente?._id || turno.paciente,
      ...('medico' in alcance ? { medico: alcance.medico } : {}),
      activo: true,
    })
      .populate('medico', 'nombre apellido')
      .select(
        'motivo diagnostico tratamiento observaciones estado fecha medico',
      );

    return res.status(200).json({
      ok: true,
      mensaje: 'Turno obtenido exitosamente',
      data: {
        turno,
        consulta: consulta || null,
      },
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      mensaje: 'Error al obtener el turno',
      error: error.message,
    });
  }
};