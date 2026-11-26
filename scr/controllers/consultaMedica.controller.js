import mongoose from 'mongoose';
import {
  crearConsultaService,
  obtenerConsultasService,
  obtenerConsultaPorIdService,
  actualizarConsultaService,
  eliminarConsultaService,
} from '../services/consultaMedica.service.js';
import { ConsultaMedica } from '../models/Consulta.js';
import { Medico } from '../models/Medico.js';
import { Paciente } from '../models/Paciente.js';
import { RolEnum } from '../enum/Rol.enum.js';
import {
  normalizarFechaCalendarioArgentina,
  obtenerFechaHoyArgentina,
} from '../utils/fecha.js';
import {
  crearMetadataPaginacion,
  ejecutarConsultaPaginada,
  obtenerParametrosPaginacion,
} from '../utils/paginacion.js';

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

const obtenerDetalleErrorConsulta = (error) => {
  if (error?.name === 'ValidationError') {
    return Object.values(error.errors || {})
      .map((validacion) => validacion.message)
      .filter(Boolean)
      .join('; ');
  }
  if (error?.name === 'CastError') {
    return `El campo ${error.path} tiene un valor inválido`;
  }
  return error?.message || 'Error inesperado';
};

export const crearConsulta = async (req, res) => {
  try {
    const usuario = req.usuario || req.user;
    const rolUsuario = String(usuario?.rol || '').toUpperCase();
    const datosParaCrear = { ...req.body };

    if (datosParaCrear.fecha !== undefined) {
      const fechaConsulta = normalizarFechaCalendarioArgentina(
        datosParaCrear.fecha,
      );
      if (!fechaConsulta) {
        const mensaje = 'La fecha de consulta no es válida; debe usar el formato YYYY-MM-DD';
        return res.status(400).json({
          ok: false,
          mensaje,
          error: mensaje,
          campo: 'fecha',
        });
      }
      const fechaHoy = obtenerFechaHoyArgentina();
      if (fechaConsulta < fechaHoy) {
        const mensaje = `No se puede registrar la consulta porque la fecha ${fechaConsulta} es anterior a hoy (${fechaHoy})`;
        return res.status(400).json({
          ok: false,
          mensaje,
          error: mensaje,
          campo: 'fecha',
        });
      }
    }

    if (rolUsuario === RolEnum.MEDICO) {
      const medicoDoc = await buscarMedicoPorUsuario(usuario);
      if (!medicoDoc) {
        return res.status(403).json({
          ok: false,
          mensaje: 'No se encontró un perfil médico asociado a tu usuario',
        });
      }
      datosParaCrear.medico = medicoDoc._id;
    }

    const consulta = await crearConsultaService(datosParaCrear);

    return res.status(201).json({
      ok: true,
      mensaje: 'Consulta registrada correctamente',
      data: consulta,
    });
  } catch (error) {
    console.error('Error en crearConsulta:', error);
    const detalle = obtenerDetalleErrorConsulta(error);
    return res.status(400).json({
      ok: false,
      mensaje: `No se pudo registrar la consulta: ${detalle}`,
      error: error.message,
    });
  }
};

export const obtenerConsultas = async (req, res) => {
  try {
    const filtro = { activo: true };
    const { pacienteId } = req.query;
    const usuario = req.usuario || req.user;
    const rolUsuario = String(usuario?.rol || '').toUpperCase();
    const paginacion = obtenerParametrosPaginacion(req.query);
    if (!paginacion) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Los parámetros page y limit deben ser enteros positivos.',
      });
    }

    if (pacienteId && mongoose.Types.ObjectId.isValid(pacienteId)) {
      filtro.paciente = new mongoose.Types.ObjectId(pacienteId);
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
      filtro.paciente = pacienteDoc._id;
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
      filtro.medico = medicoDoc._id;
    }

    const { data: consultas, pagination } = await ejecutarConsultaPaginada(
      ConsultaMedica.find(filtro)
        .populate('paciente')
        .populate('medico')
        .sort({ fecha: -1, _id: -1 }),
      ConsultaMedica,
      filtro,
      paginacion,
    );

    return res.status(200).json({
      ok: true,
      data: consultas,
      pagination,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener las consultas',
      error: error.message,
    });
  }
};

export const obtenerConsultaPorId = async (req, res) => {
  try {
    const consulta = await obtenerConsultaPorIdService(req.params.id);

    if (!consulta) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Consulta no encontrada',
      });
    }

    const usuario = req.usuario || req.user;
    const rolUsuario = String(usuario?.rol || '').toUpperCase();

    if (rolUsuario === RolEnum.PACIENTE) {
      const pacienteDoc = await buscarPacientePorUsuario(usuario);
      const consultaPacienteId = String(consulta.paciente?._id || consulta.paciente || '');
      if (!pacienteDoc || consultaPacienteId !== String(pacienteDoc._id)) {
        return res.status(403).json({
          ok: false,
          mensaje: 'No tenés permiso para ver esta consulta',
        });
      }
    } else if (rolUsuario === RolEnum.MEDICO) {
      const medicoDoc = await buscarMedicoPorUsuario(usuario);
      const consultaMedicoId = String(consulta.medico?._id || consulta.medico || '');
      if (!medicoDoc || consultaMedicoId !== String(medicoDoc._id)) {
        return res.status(403).json({
          ok: false,
          mensaje: 'No tenés permiso para ver esta consulta',
        });
      }
    }

    return res.status(200).json({
      ok: true,
      data: consulta,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener la consulta',
    });
  }
};

export const actualizarConsulta = async (req, res) => {
  try {
    const usuario = req.usuario || req.user;
    const rolUsuario = String(usuario?.rol || '').toUpperCase();
    const datosActualizacion = { ...req.body };

    if (datosActualizacion.fecha !== undefined) {
      const fechaConsulta = normalizarFechaCalendarioArgentina(
        datosActualizacion.fecha,
      );
      if (!fechaConsulta) {
        const mensaje = 'La fecha de consulta no es válida; debe usar el formato YYYY-MM-DD';
        return res.status(400).json({
          ok: false,
          mensaje,
          error: mensaje,
          campo: 'fecha',
        });
      }
      const fechaHoy = obtenerFechaHoyArgentina();
      if (fechaConsulta < fechaHoy) {
        const mensaje = `No se puede actualizar la consulta porque la fecha ${fechaConsulta} es anterior a hoy (${fechaHoy})`;
        return res.status(400).json({
          ok: false,
          mensaje,
          error: mensaje,
          campo: 'fecha',
        });
      }
    }

    if (rolUsuario === RolEnum.MEDICO) {
      const existente = await obtenerConsultaPorIdService(req.params.id);
      const medicoDoc = await buscarMedicoPorUsuario(usuario);
      const consultaMedicoId = String(existente?.medico?._id || existente?.medico || '');
      if (!existente || !medicoDoc || consultaMedicoId !== String(medicoDoc._id)) {
        return res.status(403).json({
          ok: false,
          mensaje: 'No tenés permiso para actualizar esta consulta',
        });
      }
      if (Object.keys(datosActualizacion).some((key) => key.startsWith('$'))) {
        return res.status(400).json({
          ok: false,
          mensaje: 'No se permiten operadores de actualización en la solicitud',
        });
      }
      delete datosActualizacion.medico;
      delete datosActualizacion.paciente;
    }

    const consulta = await actualizarConsultaService(
      req.params.id,
      datosActualizacion,
    );

    if (!consulta) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Consulta no encontrada',
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: 'Consulta actualizada correctamente',
      data: consulta,
    });
  } catch (error) {
    const detalle = obtenerDetalleErrorConsulta(error);
    return res.status(400).json({
      ok: false,
      mensaje: `No se pudo actualizar la consulta: ${detalle}`,
      error: error.message,
    });
  }
};

export const eliminarConsulta = async (req, res) => {
  try {
    const usuario = req.usuario || req.user;
    const rolUsuario = String(usuario?.rol || '').toUpperCase();

    if (rolUsuario === RolEnum.MEDICO) {
      const existente = await obtenerConsultaPorIdService(req.params.id);
      const medicoDoc = await buscarMedicoPorUsuario(usuario);
      const consultaMedicoId = String(existente?.medico?._id || existente?.medico || '');
      if (!existente || !medicoDoc || consultaMedicoId !== String(medicoDoc._id)) {
        return res.status(403).json({
          ok: false,
          mensaje: 'No tenés permiso para eliminar esta consulta',
        });
      }
    }

    const consulta = await eliminarConsultaService(req.params.id);

    if (!consulta) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Consulta no encontrada',
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: 'Consulta desactivada correctamente',
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al eliminar la consulta',
    });
  }
};