import mongoose from 'mongoose';
import { HistorialMedico } from '../models/historialMedico.model.js';
import { Paciente } from '../models/Paciente.js';
import { Medico } from '../models/Medico.js';
import { ConsultaMedica } from '../models/Consulta.js';
import { RolEnum } from '../enum/Rol.enum.js';
import {
  crearMetadataPaginacion,
  ejecutarConsultaPaginada,
  obtenerParametrosPaginacion,
} from '../utils/paginacion.js';

const zonaHorariaArgentina = 'America/Argentina/Buenos_Aires';
const formatoFechaArgentina = new Intl.DateTimeFormat('en-CA', {
  timeZone: zonaHorariaArgentina,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});
const formatoZonaHorariaArgentina = new Intl.DateTimeFormat('en', {
  timeZone: zonaHorariaArgentina,
  timeZoneName: 'longOffset',
});

const fechaConZonaArgentina = (fecha) => {
  if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) return fecha;

  const partes = Object.fromEntries(
    formatoFechaArgentina
      .formatToParts(fecha)
      .map(({ type, value }) => [type, value]),
  );
  const offset =
    formatoZonaHorariaArgentina
      .formatToParts(fecha)
      .find(({ type }) => type === 'timeZoneName')
      ?.value.replace(/^GMT/, '') || '+00:00';

  return `${partes.year}-${partes.month}-${partes.day}T${partes.hour}:${partes.minute}:${partes.second}.${String(fecha.getUTCMilliseconds()).padStart(3, '0')}${offset}`;
};

const serializarHistorial = (historial) => {
  const data =
    typeof historial.toObject === 'function'
      ? historial.toObject()
      : { ...historial };

  data.createdAt = fechaConZonaArgentina(data.createdAt);
  data.updatedAt = fechaConZonaArgentina(data.updatedAt);
  return data;
};

const buscarPacientePorUsuario = async (usuario) => {
  if (!usuario) return null;
  const usuarioId = usuario.id || usuario._id;
  const emailNormalizado = String(usuario.email || '').toLowerCase().trim();

  if (usuarioId && mongoose.Types.ObjectId.isValid(usuarioId)) {
    return Paciente.findOne({
      usuario: new mongoose.Types.ObjectId(usuarioId),
    }).lean();
  }
  return emailNormalizado
    ? Paciente.findOne({ email: emailNormalizado }).lean()
    : null;
};

const buscarMedicoPorUsuario = async (usuario) => {
  if (!usuario) return null;
  const usuarioId = usuario.id || usuario._id;
  const emailNormalizado = String(usuario.email || '').toLowerCase().trim();

  const filtroActivo = {
    $or: [{ activo: true }, { activo: {$exists: false } }],
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

const medicoPuedeAccederAlPaciente = async (medicoId, pacienteId) =>
  ConsultaMedica.exists({
    medico: medicoId,
    paciente: pacienteId,
    activo: true,
  });

const medicoEsCreador = (historial, medicoId) =>
  String(historial.medicoCreadorId?._id || historial.medicoCreadorId || '') ===
  String(medicoId);

export const crearHistorialMedico = async (req, res) => {
  try {
    const {
      pacienteId,
      patologiasActuales,
      antecedentes,
      medicamentosSuplementos,
      alergiasIntolerancias,
      saludDigestiva,
      observacionesGinecoObstetricas,
    } = req.body;

    if (!pacienteId || !mongoose.Types.ObjectId.isValid(pacienteId)) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Debés seleccionar un paciente válido.',
      });
    }

    const usuario = req.usuario || req.user;
    const rolUsuario = String(usuario?.rol || '').toUpperCase();
    let medicoCreadorId = null;

    if (rolUsuario === RolEnum.MEDICO) {
      const medicoDoc = await buscarMedicoPorUsuario(usuario);
      if (!medicoDoc) {
        return res.status(403).json({
          ok: false,
          mensaje: 'No se encontró un perfil médico activo asociado a tu usuario.',
        });
      }
      if (!(await medicoPuedeAccederAlPaciente(medicoDoc._id, pacienteId))) {
        return res.status(403).json({
          ok: false,
          mensaje:
            'Primero debés crear una consulta médica para este paciente antes de registrar su historial médico.',
        });
      }
      medicoCreadorId = medicoDoc._id;
    } else if (rolUsuario !== RolEnum.ADMIN) {
      return res.status(403).json({
        ok: false,
        mensaje: 'No tenés permiso para crear historiales médicos',
      });
    }

    const historialExistente = await HistorialMedico.findOne({
      pacienteId,
      medicoCreadorId,
    });
    if (historialExistente) {
      return res.status(400).json({
        ok: false,
        mensaje: historialExistente.activo
          ? 'Ya existe un historial activo de este paciente para el médico.'
          : 'Ya existe un historial desactivado de este paciente para el médico.',
      });
    }

    const medicamentosValidos = Array.isArray(medicamentosSuplementos)
      ? medicamentosSuplementos
          .filter(
            (m) =>
              m && typeof m.nombre === 'string' && m.nombre.trim() !== '',
          )
          .map((m) => ({
            nombre: m.nombre.trim(),
            dosis: m.dosis?.trim() || undefined,
            frecuencia: m.frecuencia?.trim() || undefined,
          }))
      : [];

    const nuevoHistorial = new HistorialMedico({
      pacienteId,
      medicoCreadorId,
      patologiasActuales: Array.isArray(patologiasActuales)
        ? patologiasActuales
        : [],
      antecedentes: antecedentes || {},
      medicamentosSuplementos: medicamentosValidos,
      alergiasIntolerancias: Array.isArray(alergiasIntolerancias)
        ? alergiasIntolerancias
        : [],
      saludDigestiva: saludDigestiva || {},
      observacionesGinecoObstetricas:
        observacionesGinecoObstetricas?.trim() || undefined,
    });

    await nuevoHistorial.save();

    return res.status(201).json({
      ok: true,
      mensaje: 'Historial médico creado correctamente',
      data: serializarHistorial(nuevoHistorial),
    });
  } catch (error) {
    console.error('Error en crearHistorialMedico:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        ok: false,
        mensaje: 'Ya existe un historial para este paciente y este creador.',
      });
    }
    return res.status(400).json({
      ok: false,
      mensaje: 'Error al crear el historial médico',
      error: error.message,
    });
  }
};

// 2. Obtener historiales médicos activos filtrados por rol
export const obtenerHistorialesMedicos = async (req, res) => {
  try {
    const usuario = req.usuario || req.user;
    const rolUsuario = String(usuario?.rol || '').toUpperCase();
    const filtro = { activo: true };
    const paginacion = obtenerParametrosPaginacion(req.query);
    if (!paginacion) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Los parámetros page y limit deben ser enteros positivos.',
      });
    }

    if (rolUsuario === RolEnum.PACIENTE) {
      const pacienteDoc = await buscarPacientePorUsuario(usuario);
      if (!pacienteDoc) {
        return res.status(200).json({
          ok: true,
          data: [],
          pagination: crearMetadataPaginacion(
            paginacion.page,
            paginacion.limit,
            0,
          ),
        });
      }
      filtro.pacienteId = pacienteDoc._id;
    } else if (rolUsuario === RolEnum.MEDICO) {
      const medicoDoc = await buscarMedicoPorUsuario(usuario);
      if (!medicoDoc) {
        return res.status(200).json({
          ok: true,
          data: [],
          pagination: crearMetadataPaginacion(
            paginacion.page,
            paginacion.limit,
            0,
          ),
        });
      }
      filtro.medicoCreadorId = medicoDoc._id;
    }

    const { data: historiales, pagination } = await ejecutarConsultaPaginada(
      HistorialMedico.find(filtro)
        .populate('pacienteId', 'nombre apellido dni email')
        .sort({ createdAt: -1, _id: -1 }),
      HistorialMedico,
      filtro,
      paginacion,
    );

    return res.status(200).json({
      ok: true,
      data: historiales.map(serializarHistorial),
      pagination,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener los historiales médicos',
      error: error.message,
    });
  }
};

// 3. Obtener un historial médico por su propio ID (_id)
export const obtenerHistorialMedicoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const historial = await HistorialMedico.findOne({ _id: id, activo: true })
      .populate(
        'pacienteId',
        'nombre apellido dni email fechaNacimiento sexo',
      );

    if (!historial) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Historial médico no encontrado',
      });
    }

    const usuario = req.usuario || req.user;
    const rolUsuario = String(usuario?.rol || '').toUpperCase();

    if (rolUsuario === RolEnum.PACIENTE) {
      const pacienteDoc = await buscarPacientePorUsuario(usuario);
      const histPacienteId = String(
        historial.pacienteId?._id || historial.pacienteId || '',
      );
      if (!pacienteDoc || histPacienteId !== String(pacienteDoc._id)) {
        return res.status(403).json({
          ok: false,
          mensaje: 'No tenés permiso para ver este historial médico',
        });
      }
    } else if (rolUsuario === RolEnum.MEDICO) {
      const medicoDoc = await buscarMedicoPorUsuario(usuario);
      const pacienteId = historial.pacienteId?._id || historial.pacienteId;
      if (
        !medicoDoc ||
        (!medicoEsCreador(historial, medicoDoc._id) &&
          !(await medicoPuedeAccederAlPaciente(medicoDoc._id, pacienteId)))
      ) {
        return res.status(403).json({
          ok: false,
          mensaje: 'No tenés permiso para ver este historial médico',
        });
      }
    }

    return res.status(200).json({
      ok: true,
      data: serializarHistorial(historial),
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener el historial médico',
      error: error.message,
    });
  }
};

// 4. Obtener el historial médico directamente por el ID del Paciente
export const obtenerHistorialPorPaciente = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const usuario = req.usuario || req.user;
    const rolUsuario = String(usuario?.rol || '').toUpperCase();
    const filtroHistorial = { pacienteId, activo: true };

    if (rolUsuario === RolEnum.PACIENTE) {
      const pacienteDoc = await buscarPacientePorUsuario(usuario);
      if (!pacienteDoc || String(pacienteDoc._id) !== String(pacienteId)) {
        return res.status(403).json({
          ok: false,
          mensaje:
            'No tenés permiso para consultar el historial de otro paciente',
        });
      }
    } else if (rolUsuario === RolEnum.MEDICO) {
      const medicoDoc = await buscarMedicoPorUsuario(usuario);
      if (!medicoDoc) {
        return res.status(403).json({
          ok: false,
          mensaje: 'No tenés permiso para consultar este historial médico',
        });
      }
      filtroHistorial.medicoCreadorId = medicoDoc._id;
    }

    const historial = await HistorialMedico.findOne(filtroHistorial)
      .populate(
        'pacienteId',
        'nombre apellido dni email fechaNacimiento sexo',
      )
      .sort({ createdAt: -1 });

    if (!historial) {
      return res.status(404).json({
        ok: false,
        mensaje: 'El paciente aún no tiene un historial médico cargado',
      });
    }

    return res.status(200).json({
      ok: true,
      data: serializarHistorial(historial),
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al buscar el historial médico del paciente',
      error: error.message,
    });
  }
};

// 5. Actualizar historial médico por ID
export const actualizarHistorialMedico = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      pacienteId,
      activo,
      ...datosActualizados
    } = req.body;
    delete datosActualizados.medicoCreadorId;
    const usuario = req.usuario || req.user;
    const rolUsuario = String(usuario?.rol || '').toUpperCase();
    const filtro = { _id: id, activo: true };

    if (rolUsuario === RolEnum.MEDICO) {
      if (Object.keys(datosActualizados).some((key) => key.startsWith('$'))) {
        return res.status(400).json({
          ok: false,
          mensaje: 'No se permiten operadores de actualización en la solicitud',
        });
      }
      const medicoDoc = await buscarMedicoPorUsuario(usuario);
      const historialActual = await HistorialMedico.findOne(filtro).lean();
      if (
        !medicoDoc ||
        !historialActual ||
        (!medicoEsCreador(historialActual, medicoDoc._id) &&
          !(await medicoPuedeAccederAlPaciente(
            medicoDoc._id,
            historialActual.pacienteId,
          )))
      ) {
        return res.status(403).json({
          ok: false,
          mensaje: 'No tenés permiso para actualizar este historial médico',
        });
      }
      filtro.pacienteId = historialActual.pacienteId;
    }

    const historialActualizado = await HistorialMedico.findOneAndUpdate(
      filtro,
      datosActualizados,
      { new: true, runValidators: true },
    ).populate('pacienteId', 'nombre apellido dni');

    if (!historialActualizado) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Historial médico no encontrado o inactivo',
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: 'Historial médico actualizado correctamente',
      data: serializarHistorial(historialActualizado),
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      mensaje: 'Error al actualizar el historial médico',
      error: error.message,
    });
  }
};

// 6. Eliminar historial médico (Baja lógica: activo = false)
export const eliminarHistorialMedico = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = req.usuario || req.user;
    const rolUsuario = String(usuario?.rol || '').toUpperCase();
    const filtro = { _id: id, activo: true };

    if (rolUsuario === RolEnum.MEDICO) {
      const medicoDoc = await buscarMedicoPorUsuario(usuario);
      const historialActual = await HistorialMedico.findOne(filtro).lean();
      if (
        !medicoDoc ||
        !historialActual ||
        (!medicoEsCreador(historialActual, medicoDoc._id) &&
          !(await medicoPuedeAccederAlPaciente(
            medicoDoc._id,
            historialActual.pacienteId,
          )))
      ) {
        return res.status(403).json({
          ok: false,
          mensaje: 'No tenés permiso para eliminar este historial médico',
        });
      }
      filtro.pacienteId = historialActual.pacienteId;
    }

    const historialDesactivado = await HistorialMedico.findOneAndUpdate(
      filtro,
      { activo: false },
      { new: true },
    );

    if (!historialDesactivado) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Historial médico no encontrado o ya fue desactivado',
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: 'Historial médico desactivado correctamente',
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al eliminar el historial médico',
      error: error.message,
    });
  }
};