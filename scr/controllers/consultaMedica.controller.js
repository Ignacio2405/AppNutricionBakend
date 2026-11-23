import {
    crearConsultaService,
    obtenerConsultasService,
    obtenerConsultaPorIdService,
    actualizarConsultaService,
    eliminarConsultaService
} from '../services/consultaMedica.service.js';
import { ConsultaMedica } from '../models/Consulta.js';

export const crearConsulta = async (req, res) => {
    try {
    
        const medicoId = req.usuario.id; 
        const datosParaCrear = {
            ...req.body,
            medico: medicoId // Sobrescribimos o agregamos el ID seguro
        };

        const consulta = await crearConsultaService(datosParaCrear);

        return res.status(201).json({
            ok: true,
            mensaje: 'Consulta registrada correctamente',
            data: consulta
        });

    } catch (error) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Error al registrar la consulta',
            error: error.message
        });
    }
};

export const obtenerConsultas = async (req, res) => {
  try {
    const filtro = { activo: true };
    const { pacienteId } = req.query;

    if (pacienteId && mongoose.Types.ObjectId.isValid(pacienteId)) {
      filtro.paciente = new mongoose.Types.ObjectId(pacienteId);
    }

    if (req.usuario.rol === "paciente") {
      filtro.paciente = req.usuario.paciente;
    }

    if (req.usuario.rol === "medico" && req.usuario.medico) {
      filtro.medico = req.usuario.medico;
    }

    const consultas = await ConsultaMedica.find(filtro)
      .populate("paciente")
      .populate("medico")
      .sort({ fecha: -1 });

    return res.status(200).json({
      ok: true,
      data: consultas,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener las consultas",
    });
  }
};
export const obtenerConsultaPorId = async (req, res) => {
    try {
        const consulta = await obtenerConsultaPorIdService(req.params.id);

        if (!consulta) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Consulta no encontrada'
            });
        }

        return res.status(200).json({
            ok: true,
            data: consulta
        });

    } catch (error) {
        return res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener la consulta'
        });
    }
};

export const actualizarConsulta = async (req, res) => {
    try {
        const consulta = await actualizarConsultaService(
            req.params.id,
            req.body
        );

        if (!consulta) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Consulta no encontrada'
            });
        }

        return res.status(200).json({
            ok: true,
            mensaje: 'Consulta actualizada correctamente',
            data: consulta
        });

    } catch (error) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Error al actualizar la consulta',
            error: error.message
        });
    }
};

export const eliminarConsulta = async (req, res) => {
    try {
        const consulta = await eliminarConsultaService(req.params.id);

        if (!consulta) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Consulta no encontrada'
            });
        }

        return res.status(200).json({
            ok: true,
            mensaje: 'Consulta desactivada correctamente'
        });

    } catch (error) {
        return res.status(500).json({
            ok: false,
            mensaje: 'Error al eliminar la consulta'
        });
    }
};
