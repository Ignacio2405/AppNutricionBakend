
import { ConsultaMedica } from '../models/Consulta.js';

export const crearConsultaService = async (datos) => {
    const consulta = new ConsultaMedica(datos);

    return await consulta.save();
};

export const obtenerConsultasService = async () => {
    return await ConsultaMedica.find({ activo: true })
        .populate('paciente')
        .populate('medico')
        .populate('turno')
        .sort({ fecha: -1 });
};

export const obtenerConsultaPorIdService = async (id) => {
    return await ConsultaMedica.findById(id)
        .populate('paciente')
        .populate('medico')
        .populate('turno');
};

export const actualizarConsultaService = async (id, datos) => {
    return await ConsultaMedica.findByIdAndUpdate(
        id,
        datos,
        {
            new: true,
            runValidators: true
        }
    );
};

export const eliminarConsultaService = async (id) => {
    return await ConsultaMedica.findByIdAndUpdate(
        id,
        { activo: false },
        { new: true }
    );
};
