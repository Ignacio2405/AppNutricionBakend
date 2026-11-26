import mongoose from 'mongoose';
import { Agenda } from '../models/Agenda.js';
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

const getAgenda = async (req, res) => {
  try {
    const { medico, diaSemana } = req.query;
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

    if (diaSemana) filtro.diaSemana = diaSemana;

    const { data: horario, pagination: metadata } =
      await ejecutarConsultaPaginada(
        Agenda.find(filtro).populate('medico').sort({ _id: 1 }),
        Agenda,
        filtro,
        paginacion,
      );

    return res.status(200).json({
      ok: true,
      mensaje: 'Agenda obtenida correctamente',
      data: horario,
      pagination: metadata,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener la agenda',
      error: error.message,
    });
  }
};

const createAgenda = async (req, res) => {
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

    const nuevoHorario = await Agenda.create(datos);

    return res.status(201).json({
      ok: true,
      mensaje: 'Agenda creada correctamente',
      data: nuevoHorario,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al crear la Agenda',
      error: error.message,
    });
  }
};

const updateAgenda = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = req.usuario || req.user;
    const rolUsuario = String(usuario?.rol || '').toUpperCase();

    const filtro = { _id: id, activo: true };

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

    const datosActualizacion = { ...req.body };
    if (rolUsuario === RolEnum.MEDICO) {
      delete datosActualizacion.medico;
    }

    const agendaActualizado = await Agenda.findOneAndUpdate(
      filtro,
      { $set: datosActualizacion },
      {
        returnDocument: 'after',
        runValidators: true,
        context: 'query',
      },
    );

    if (!agendaActualizado) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Horario de atención no encontrado o inactivo',
        data: null,
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: 'Horario de atención actualizado correctamente',
      data: agendaActualizado,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al actualizar la agenda',
      error: error.message,
    });
  }
};

const deleteAgenda = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = req.usuario || req.user;
    const rolUsuario = String(usuario?.rol || '').toUpperCase();

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

    const agendaInactivado = await Agenda.findOneAndUpdate(
      filtro,
      { $set: { activo: false } },
      { returnDocument: 'after' },
    );

    if (!agendaInactivado) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Agenda no encontrado',
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: 'Agenda dada de baja correctamente',
      data: agendaInactivado,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al dar de baja la agenda',
      error: error.message,
    });
  }
};

export { getAgenda, createAgenda, updateAgenda, deleteAgenda };