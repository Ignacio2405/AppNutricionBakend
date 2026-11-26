import { ObraSocial } from '../models/ObraSocial.js'; 
import {
    ejecutarConsultaPaginada,
    obtenerParametrosPaginacion,
} from '../utils/paginacion.js';


export const getObrasSociales = async (req, res) => {
    try {
        const { razonSocial, cuit } = req.query;
        const paginacion = obtenerParametrosPaginacion(req.query);
        if (!paginacion) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Los parámetros page y limit deben ser enteros positivos.'
            });
        }
        const filtro = { activo: true }; 

        if (razonSocial) {
            filtro.razonSocial = { $regex: razonSocial.toUpperCase(), $options: 'I' };
        }
        if (cuit) {
            filtro.cuit = cuit;
        }
        
        const { data: obrasSociales, pagination } = await ejecutarConsultaPaginada(
            ObraSocial.find(filtro).select('+activo').sort({ _id: 1 }),
            ObraSocial,
            filtro,
            paginacion
        );

        return res.status(200).json({
            ok: true,
            mensaje: 'Obras sociales obtenidas exitosamente',
            data: obrasSociales,
            pagination
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener las obras sociales',
            error: error.message
        });
    }
};

export const getObraSocialById = async (req, res) => {
    try {
        const { id } = req.params;
        const obraSocial = await ObraSocial.findOne({ _id: id, activo: true }).select('+activo');

        if (!obraSocial) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Obra social no encontrada o inactiva'
            });
        }

        return res.status(200).json({
            ok: true,
            mensaje: 'Obra social obtenida exitosamente',
            data: obraSocial
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener la obra social',
            error: error.message
        });
    }
};

export const createObraSocial = async (req, res) => {
    try {
        const { razonSocial, cuit, direccion, telefono, activo } = req.body;

        const nuevaObraSocial = await ObraSocial.create({
            razonSocial,
            cuit,
            direccion,
            telefono,
            activo
        });

        return res.status(201).json({
            ok: true,
            mensaje: 'Obra social creada exitosamente',
            data: nuevaObraSocial
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({
                ok: false,
                mensaje: 'Ya existe una obra social registrada con este CUIT'
            });
        }
        return res.status(500).json({
            ok: false,
            mensaje: 'Error al crear la obra social',
            error: error.message
        });
    }
};

export const updateObraSocial = async (req, res) => {
    try {
        const { id } = req.params;
        
        const obraSocialActualizada = await ObraSocial.findOneAndUpdate(
            { _id: id, activo: true }, 
            { $set: req.body },
            { 
                returnDocument: 'after', 
                runValidators: true,
                context: 'query'
            }
        ).select('+activo');

        if (!obraSocialActualizada) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Obra social no encontrada o inactiva'
            });
        }

        return res.status(200).json({
            ok: true,
            mensaje: 'Obra social actualizada exitosamente',
            data: obraSocialActualizada
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({
                ok: false,
                mensaje: 'El CUIT ingresado ya pertenece a otra obra social'
            });
        }
        return res.status(500).json({
            ok: false,
            mensaje: 'Error al actualizar la obra social',
            error: error.message
        });
    }
};

export const deleteObraSocial = async (req, res) => {
    try {
        const { id } = req.params;
        
        const obraSocialInactivada = await ObraSocial.findByIdAndUpdate(
            id,
            { $set: { activo: false } },
            { returnDocument: 'after' }
        ).select('+activo');

        if (!obraSocialInactivada) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Obra social no encontrada'
            });
        }

        return res.status(200).json({
            ok: true,
            mensaje: 'Obra social dada de baja correctamente',
            data: obraSocialInactivada
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            mensaje: 'Error al dar de baja la obra social',
            error: error.message
        });
    }
};