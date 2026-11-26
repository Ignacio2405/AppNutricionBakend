import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Usuario } from '../models/Usuario.js';

const JWT_SECRET = process.env.JWT_SECRET;

export const login = async (req, res) => {
    try {
        const emailNormalizado = typeof req.body?.email === 'string'
            ? req.body.email.trim().toLowerCase()
            : '';
        const password = req.body?.password ?? '';

        console.log('[LOGIN] Datos recibidos:', {
            email: emailNormalizado,
            tienePassword: Boolean(password)
        });

        const usuario = await Usuario.findOne({ email: emailNormalizado, activo: true });
        console.log('[LOGIN] Usuario encontrado:', usuario ? { id: usuario.id, email: usuario.email, activo: usuario.activo } : null);

        if (!usuario) {
            return res.status(401).json({
                ok: false,
                mensaje: 'Credencial inválida'
            });
        }

        const passwordOk = await bcrypt.compare(password, usuario.password);
        console.log('[LOGIN] passwordOk:', passwordOk);

        if (!passwordOk) {
            return res.status(401).json({
                ok: false,
                mensaje: 'Credencial inválida'
            });
        }

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email, user: usuario.user, rol: usuario.rol },
            JWT_SECRET,
            { expiresIn: '9h' }
        );

        return res.status(200).json({
            ok: true,
            token,
            debeCambiarPassword: usuario.debeCambiarPassword
        });
    } catch (error) {
        console.error('[LOGIN] Error interno:', error);
        return res.status(500).json({
            ok: false,
            mensaje: 'Error en el servidor al iniciar sesión',
            error: error.message
        });
    }
};

export const registro = async (req, res) => {
    try {
        const { email, user, password, rol } = req.body;

        const existente = await Usuario.findOne({ $or: [{ email }, { user }] });
        if (existente) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Email o usuario ya registrado'
            });
        }

        const hash = await bcrypt.hash(password, 10);
        const usuario = await Usuario.create({ email, user, password: hash, rol });

        return res.status(201).json({
            ok: true,
            mensaje: 'Usuario registrado',
            data: {
                id: usuario.id,
                email: usuario.email,
                user: usuario.user,
            }
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({
                ok: false,
                mensaje: 'Email o usuario ya registrado'
            });
        }
        return res.status(500).json({
            ok: false,
            mensaje: 'Error en el servidor al registrar el usuario',
            error: error.message
        });
    }
};

export const cambiarPasswordPrimerLogin = async (req, res) => {
    try {
        const { passwordActual, nuevoPassword } = req.body;
    
        const userId = req.usuario?.id || req.usuario?._id;

        const usuario = await Usuario.findById(userId);
        if (!usuario) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        // Verificamos la contraseña actual
        const passwordOk = await bcrypt.compare(passwordActual, usuario.password);
        if (!passwordOk) {
            return res.status(400).json({
                ok: false,
                mensaje: 'La contraseña actual es incorrecta'
            });
        }

        // Hasheamos la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(nuevoPassword, salt);

        // Actualizamos la contraseña y quitamos la obligación del primer login
        usuario.password = hashedPassword;
        usuario.debeCambiarPassword = false; 
        await usuario.save();

        return res.status(200).json({
            ok: true,
            mensaje: 'Contraseña actualizada con éxito'
        });

    } catch (error) {
        console.error("Error al cambiar contraseña:", error);
        return res.status(500).json({
            ok: false,
            mensaje: 'Error en el servidor al cambiar la contraseña',
            error: error.message
        });
    }
};