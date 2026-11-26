import mongoose, { Types } from 'mongoose';
import bcrypt from 'bcrypt';
import { Medico } from '../models/Medico.js';
import { Usuario} from '../models/Usuario.js';
import { RolEnum } from '../enum/Rol.enum.js';
import {
    ejecutarConsultaPaginada,
    obtenerParametrosPaginacion,
} from '../utils/paginacion.js';


export const getMedicos = async (req, res) => {
    try {
        const { apellido, dni } = req.query;
        const paginacion = obtenerParametrosPaginacion(req.query);
        if (!paginacion) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Los parámetros page y limit deben ser enteros positivos.'
            });
        }
        
        const filtro = { $or: [{ activo: true }, { activo: { $exists: false } }] };

        if (apellido) {
            filtro.apellido = { $regex: apellido.toUpperCase(), $options: 'I' };
        }
        if (dni) {
            filtro.dni = dni;
        }

        const { data: medicos, pagination } = await ejecutarConsultaPaginada(
            Medico.find(filtro).populate('obraSocial').sort({ _id: 1 }),
            Medico,
            filtro,
            paginacion
        );

        return res.status(200).json({
            ok: true,
            mensaje: 'Médicos obtenidos exitosamente',
            data: medicos,
            pagination
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener los médicos',
            error: error.message
        });
    }
};


export const getMedicoById = async (req, res) => {
    try {
        const { id } = req.params;
        const medico = await Medico.findOne({ _id: id, activo: true }).populate('obraSocial');

        if (!medico) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Médico no encontrado o inactivo'
            });
        }

        return res.status(200).json({
            ok: true,
            mensaje: 'Médico obtenido exitosamente',
            data: medico
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener el médico',
            error: error.message
        });
    }
};

export const createMedico = async (req, res) => {
    const {
        email,
        user: nombreUsuario,
        password,
        ...datosMedico
    } = req.body;

    if (!email || !datosMedico.dni) {
        return res.status(400).json({
            ok: false,
            mensaje: 'El correo electrónico y el DNI son obligatorios'
        });
    }

    const emailNormalizado = email.toLowerCase().trim();
    const dniNormalizado = String(datosMedico.dni).trim();
    const session = await mongoose.startSession();

    try {
        // 1. Verificar si existe un usuario con el mismo email o username
        const condicionesOr = [{ email: emailNormalizado }];

        if (nombreUsuario) {
            condicionesOr.push({ user: nombreUsuario.trim() });
        }

        const usuarioExistente = await Usuario.findOne({
            $or: condicionesOr
        });

        if (usuarioExistente) {
            const campoDuplicado =
                usuarioExistente.email === emailNormalizado
                    ? 'correo electrónico'
                    : 'nombre de usuario';

            return res.status(400).json({
                ok: false,
                mensaje: `El ${campoDuplicado} ya se encuentra registrado`
            });
        }

        // 2. Iniciar transacción
        session.startTransaction();

        // 3. Hashear contraseña (usa el DNI si no se envía password)
        const passwordPlana = password || dniNormalizado;
        const hashedPassword = await bcrypt.hash(passwordPlana, 10);

        // 4. Crear usuario con rol MEDICO
        const [nuevoUsuario] = await Usuario.create(
            [{
                email: emailNormalizado,
                user: nombreUsuario ? nombreUsuario.trim() : emailNormalizado,
                password: hashedPassword,
                rol: RolEnum.MEDICO,
                debeCambiarPassword: true
            }],
            { session }
        );

        if (!nuevoUsuario) {
            throw new Error('No se pudo crear el usuario');
        }

        // 5. Formatear obraSocial si viene como array (o valor único)
        let obrasSocialesFormateadas = [];
        if (Array.isArray(datosMedico.obraSocial)) {
            obrasSocialesFormateadas = datosMedico.obraSocial
                .filter(Boolean)
                .map((id) => new Types.ObjectId(id));
        } else if (datosMedico.obraSocial) {
            obrasSocialesFormateadas = [new Types.ObjectId(datosMedico.obraSocial)];
        }

        // 6. Crear médico
        const [nuevoMedico] = await Medico.create(
            [{
                ...datosMedico,
                dni: dniNormalizado,
                email: emailNormalizado,
                obraSocial: obrasSocialesFormateadas,
                usuario: nuevoUsuario._id
            }],
            { session }
        );

        if (!nuevoMedico) {
            throw new Error('No se pudo crear el médico');
        }

        // 7. Confirmar transacción
        await session.commitTransaction();

        // 8. Respuesta exitosa
        return res.status(201).json({
            ok: true,
            mensaje: 'Médico y usuario creados exitosamente',
            data: {
                medico: nuevoMedico,
                usuario: {
                    id: nuevoUsuario._id,
                    email: nuevoUsuario.email,
                    user: nuevoUsuario.user,
                    rol: nuevoUsuario.rol
                }
            }
        });

    } catch (error) {
        // 9. Revertir transacción si ocurrió un error
        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        // 10. Manejar duplicados de MongoDB
        if (error?.code === 11000) {
            return res.status(409).json({
                ok: false,
                mensaje: 'El email, DNI o nombre de usuario ya están registrados'
            });
        }

        // Errores de validación de Mongoose
        if (error?.name === 'ValidationError') {
            return res.status(400).json({
                ok: false,
                mensaje: 'Datos inválidos al crear el médico o usuario',
                error: error.message
            });
        }

        console.error('Error al crear médico:', error);

        return res.status(500).json({
            ok: false,
            mensaje: 'Error al crear el médico y su usuario',
            error: error.message
        });

    } finally {
        // 11. Cerrar sesión siempre
        await session.endSession();
    }
};
export const updateMedico = async (req, res) => {
    try {
        const { id } = req.params;

        const medicoActualizado = await Medico.findOneAndUpdate(
            { _id: id, activo: true }, 
            { $set: req.body },
            { 
                returnDocument: 'after', 
                runValidators: true,
                context: 'query'
            }
        ).populate('obraSocial');

        if (!medicoActualizado) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Médico no encontrado o inactivo'
            });
        }

        return res.status(200).json({
            ok: true,
            mensaje: 'Médico actualizado exitosamente',
            data: medicoActualizado
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({
                ok: false,
                mensaje: 'El DNI o email ingresado ya pertenece a otro médico'
            });
        }
        return res.status(500).json({
            ok: false,
            mensaje: 'Error al actualizar el médico',
            error: error.message
        });
    }
};
export const deleteMedico = async (req, res) => {
    try {
        const { id } = req.params;
        
        const medicoInactivado = await Medico.findByIdAndUpdate(
            id,
            { $set: { activo: false } },
            { returnDocument: 'after' }
        );

        if (!medicoInactivado) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Médico no encontrado'
            });
        }

        return res.status(200).json({
            ok: true,
            mensaje: 'Médico dado de baja (eliminación lógica) correctamente',
            data: medicoInactivado
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            mensaje: 'Error al dar de baja el médico',
            error: error.message
        });
    }
};