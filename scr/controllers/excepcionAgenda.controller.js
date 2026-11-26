import mongoose from 'mongoose';
import { ExcepcionAgenda } from '../models/ExcepcionAgenda.js';
import { Medico } from '../models/Medico.js';
import { RolEnum } from '../enum/Rol.enum.js';
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

const normalizarFechaUtc = (fecha) => {
  if (!fecha) return null;

  if (typeof fecha === 'string') {
    const matchIso = fecha.trim().match(/^(\d{4}-\d{2}-\d{2})/);
    if (matchIso) {
      const d = new Date(`${matchIso[1]}T00:00:00.000Z`);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }

  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return null;

  const anio = d.getUTCFullYear();
  const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dia = String(d.getUTCDate()).padStart(2, '0');
  return new Date(`${anio}-${mes}-${dia}T00:00:00.000Z`);
};

export const getExcepcionesAgenda = async (req, res) => {
  try {
    const { medico, fecha } = req.query;
    const usuario = req.usuario || req.user;
    const rolUsuario = String(usuario?.rol || '').toUpperCase();
    const paginacion = obtenerParametrosPaginacion(req.query);
    if (!paginacion) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Los parámetros page y limit deben ser enteros positivos.',
      });
    }

    const filtro = { activo: true };

    if (rolUsuario === RolEnum.MEDICO) {
      const medicoDoc = await buscarMedicoPorUsuario(usuario);
      if (!medicoDoc) {
        return res.status(200).json({
          ok: true,
          mensaje: 'No se encontró un perfil médico asociado a tu usuario',
          data: [],
          pagination: crearMetadataPaginacion(
            paginacion.page,
            paginacion.limit,
            0,
          ),
        });
      }
      filtro.medico = medicoDoc._id;
    } else if (medico && mongoose.Types.ObjectId.isValid(medico)) {
      filtro.medico = new mongoose.Types.ObjectId(medico);
    }

    if (fecha) {
      const fechaNormalizada = normalizarFechaUtc(fecha);
      if (fechaNormalizada) {
        const fechaStr = fechaNormalizada.toISOString().split('T')[0];
        const inicioDia = new Date(`${fechaStr}T00:00:00.000Z`);
        const finDia = new Date(`${fechaStr}T23:59:59.999Z`);
        filtro.fecha = { $gte: inicioDia, $lte: finDia };
      }
    }

    const { data: excepciones, pagination: metadata } =
      await ejecutarConsultaPaginada(
        ExcepcionAgenda.find(filtro)
          .populate('medico', 'nombre apellido')
          .sort({ fecha: -1, createdAt: -1, _id: -1 }),
        ExcepcionAgenda,
        filtro,
        paginacion,
      );

    return res.status(200).json({
      ok: true,
      mensaje: 'Excepciones obtenidas correctamente',
      data: excepciones,
      pagination: metadata,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener las excepciones',
      error: error.message,
    });
  }
};

export const crearExcepcionAgenda = async (req, res) => {
  try {
    const usuario = req.usuario || req.user;
    const rolUsuario = String(usuario?.rol || '').toUpperCase();
    const datos = { ...req.body };

    if (rolUsuario === RolEnum.MEDICO) {
      const medicoDoc = await buscarMedicoPorUsuario(usuario);
      if (!medicoDoc) {
        return res.status(403).json({
          ok: false,
          mensaje: 'No se encontró un perfil médico asociado a tu usuario',
        });
      }
      datos.medico = medicoDoc._id;
    }

    if (!datos.medico || !mongoose.Types.ObjectId.isValid(datos.medico)) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Debe seleccionar un médico válido',
      });
    }

    if (datos.fecha !== undefined) {
      const fechaNormalizada = normalizarFechaUtc(datos.fecha);
      if (!fechaNormalizada) {
        return res.status(400).json({
          ok: false,
          mensaje: 'La fecha de la excepción no es válida',
        });
      }
      datos.fecha = fechaNormalizada;
    }

    const nuevaExcepcion = await ExcepcionAgenda.create(datos);
    const poblada = await ExcepcionAgenda.findById(nuevaExcepcion._id).populate(
      'medico',
      'nombre apellido',
    );

    return res.status(201).json({
      ok: true,
      mensaje: 'Excepción creada correctamente',
      data: poblada || nuevaExcepcion,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al crear la excepción',
      error: error.message,
    });
  }
};

export const desactivarExcepcionAgenda = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = req.usuario || req.user;
    const rolUsuario = String(usuario?.rol || '').toUpperCase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El ID de la excepción no es válido',
      });
    }

    const filtro = { _id: id };

    if (rolUsuario === RolEnum.MEDICO) {
      const medicoDoc = await buscarMedicoPorUsuario(usuario);
      if (!medicoDoc) {
        return res.status(403).json({
          ok: false,
          mensaje: 'No se encontró un perfil médico asociado a tu usuario',
        });
      }
      filtro.medico = medicoDoc._id;
    }

    const excepcionEliminada = await ExcepcionAgenda.findOneAndUpdate(
      filtro,
      { $set: { activo: false } },
      { returnDocument: 'after' },
    );

    if (!excepcionEliminada) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Excepción no encontrada',
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: 'Excepción eliminada correctamente',
      data: excepcionEliminada,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al eliminar la excepción',
      error: error.message,
    });
  }
};