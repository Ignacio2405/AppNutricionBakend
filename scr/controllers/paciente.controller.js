import bcrypt from 'bcrypt';
import {Paciente} from '../models/Paciente.js';
import { Usuario } from '../models/Usuario.js';
import mongoose, { Types } from 'mongoose';
import { RolEnum } from '../enum/Rol.enum.js';
import {
    ejecutarConsultaPaginada,
    obtenerParametrosPaginacion,
} from '../utils/paginacion.js';

export const getPacientes = async (req, res) => {
    try {
        const { obraSocial, dni } = req.query;
        const paginacion = obtenerParametrosPaginacion(req.query);
        if (!paginacion) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Los parámetros page y limit deben ser enteros positivos.'
            });
        }
        const filtro = {};

        if (obraSocial) filtro['obraSocial.razonSocial'] = obraSocial.toUpperCase();
        if (dni) filtro.dni = dni;

        const { data: pacientes, pagination } = await ejecutarConsultaPaginada(
            Paciente.find(filtro).sort({ _id: 1 }),
            Paciente,
            filtro,
            paginacion
        );

        return res.status(200).json({
            ok: true,
            mensaje: 'Pacientes obtenidos exitosamente',
            data: pacientes,
            pagination
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener los pacientes',
            error: error.message
        });
    }
};

export const getPacienteById = async (req, res) => {
    try {
        const paciente = await Paciente.findById(req.params.id).populate('obraSocial');

        if (!paciente) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Paciente no encontrado'
            });
        }

        return res.status(200).json({
            ok: true,
            mensaje: 'Paciente obtenido exitosamente',
            data: paciente
        });
    } catch (error) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Error al obtener el paciente',
            error: error.message
        });
    }
};

export const createPaciente = async (req, res) => {
    const {
        email,
        user: nombreUsuario,
        password,
        ...datosPaciente
    } = req.body;

    const emailNormalizado = email.toLowerCase().trim();
    const session = await mongoose.startSession();

    try {
        // 1. Verificar si existe un usuario con el mismo email o username
        const condicionesOr = [{ email: emailNormalizado }];

        if (nombreUsuario) {
            condicionesOr.push({ user: nombreUsuario });
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

        // 3. Hashear contraseña
        const passwordPlana = password || datosPaciente.dni;
        const hashedPassword = await bcrypt.hash(passwordPlana, 10);

        // 4. Crear usuario
        const [nuevoUsuario] = await Usuario.create(
            [{
                email: emailNormalizado,
                user: nombreUsuario || emailNormalizado,
                password: hashedPassword,
                rol: RolEnum.PACIENTE,
                debeCambiarPassword: true
            }],
            { session }
        );

        if (!nuevoUsuario) {
            throw new Error('No se pudo crear el usuario');
        }

        // 5. Crear paciente
        const [nuevoPaciente] = await Paciente.create(
            [{
                ...datosPaciente,
                email: emailNormalizado,
                fechaNacimiento: new Date(datosPaciente.fechaNacimiento),
                obraSocial: datosPaciente.obraSocial
                    ? new Types.ObjectId(datosPaciente.obraSocial)
                    : null,
                usuario: nuevoUsuario._id
            }],
            { session }
        );

        if (!nuevoPaciente) {
            throw new Error('No se pudo crear el paciente');
        }

        // 6. Confirmar transacción
        await session.commitTransaction();

        // 7. Respuesta exitosa
        return res.status(201).json({
            ok: true,
            mensaje: 'Paciente y usuario creados exitosamente',
            data: {
                paciente: nuevoPaciente,
                usuario: {
                    id: nuevoUsuario._id,
                    email: nuevoUsuario.email,
                    user: nuevoUsuario.user
                }
            }
        });

    } catch (error) {
        // 8. Revertir transacción si ocurrió un error
        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        // 9. Manejar duplicados de MongoDB
        if (error?.code === 11000) {
            return res.status(409).json({
                ok: false,
                mensaje: 'El email, DNI o nombre de usuario ya están registrados'
            });
        }

        console.error('Error al crear paciente:', error);

        return res.status(500).json({
            ok: false,
            mensaje: 'Error al crear el paciente y su usuario',
            error: error.message
        });

    } finally {
        // 10. Cerrar sesión siempre
        await session.endSession();
    }
};

export const updatePaciente = async (req, res) => {
    try {
        const pacienteActualizado = await Paciente.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { 
                returnDocument: 'after', 
                runValidators: true,
                context: 'query'
            }
        );

        if (!pacienteActualizado) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Paciente no encontrado'
            });
        }

        return res.status(200).json({
            ok: true,
            mensaje: 'Paciente actualizado exitosamente',
            data: pacienteActualizado
        });
    } catch (error) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Error al actualizar el paciente',
            error: error.message
        });
    }
};

export const updateContactoDireccion = async (req, res) => {
    try {
        const pacienteActualizado = await Paciente.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { 
                returnDocument: 'after', 
                runValidators: true,
                context: 'query'
            }
        );

        if (!pacienteActualizado) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Paciente no encontrado'
            });
        }

        return res.status(200).json({
            ok: true,
            mensaje: 'Datos de contacto y dirección actualizados correctamente',
            data: pacienteActualizado
        });
    } catch (error) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Error al actualizar el contacto y dirección',
            error: error.message
        });
    }
};

export const deletePaciente = async (req, res) => {
    try {
        const pacienteBorrado = await Paciente.findByIdAndDelete(req.params.id);

        if (!pacienteBorrado) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Paciente no encontrado'
            });
        }

        return res.status(200).json({
            ok: true,
            mensaje: 'Paciente eliminado correctamente',
            data: pacienteBorrado
        });
    } catch (error) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Error al eliminar el paciente',
            error: error.message
        });
    }
};

