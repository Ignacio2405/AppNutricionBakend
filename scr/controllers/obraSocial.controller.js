import { ObraSocial } from '../models/ObraSocial.js'; 

export const getObrasSociales = async (req, res, next) => {
    try {
        const { razonSocial, cuit } = req.query;
        const filtro = {};

        if (razonSocial) {
            filtro.razonSocial = { $regex: razonSocial.toUpperCase(), $options: 'I' };
        }
        if (cuit) {
            filtro.cuit = cuit;
        }

        const obrasSociales = await ObraSocial.find(filtro);

        return res.status(200).json({
            ok: true,
            mensaje: 'Obras sociales obtenidas exitosamente',
            data: obrasSociales
        });
    } catch (error) {
        next(error);
    }
};

export const getObraSocialById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const obraSocial = await ObraSocial.findById(id);

        if (!obraSocial) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Obra social no encontrada'
            });
        }

        return res.status(200).json({
            ok: true,
            mensaje: 'Obra social obtenida exitosamente',
            data: obraSocial
        });
    } catch (error) {
        next(error);
    }
};

export const createObraSocial = async (req, res, next) => {
    try {
        const { razonSocial, cuit, direccion, telefono } = req.body;

        const nuevaObraSocial = await ObraSocial.create({
            razonSocial,
            cuit,
            direccion,
            telefono
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
        next(error);
    }
};

export const updateObraSocial = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const obraSocialActualizada = await ObraSocial.findByIdAndUpdate(
            id,
            { $set: req.body },
            { 
                returnDocument: 'after', 
                runValidators: true,
                context: 'query'
            }
        );

        if (!obraSocialActualizada) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Obra social no encontrada'
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
        next(error);
    }
};

export const deleteObraSocial = async (req, res, next) => {
    try {
        const { id } = req.params;
        const obraSocialBorrada = await ObraSocial.findByIdAndDelete(id);

        if (!obraSocialBorrada) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Obra social no encontrada'
            });
        }

        return res.status(200).json({
            ok: true,
            mensaje: 'Obra social eliminada correctamente',
            data: obraSocialBorrada
        });
    } catch (error) {
        next(error);
    }
};