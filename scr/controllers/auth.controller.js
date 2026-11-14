import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Usuario } from '../models/Usuario.js';

const JWT_SECRET = process.env.JWT_SECRET;

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const usuario = await Usuario.findOne({ email, activo: true });
        if (!usuario) {
            return res.status(401).json({
                ok: false,
                mensaje: 'Credencial inválida'
            });
        }

        const passwordOk = await bcrypt.compare(password, usuario.password);
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
        next(error);
    }
};

export const registro = async (req, res, next) => {
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
        next(error);
    }
};

export const cambiarPasswordPrimerLogin = async (req, res, next) => {
    try {
        const usuarioId = req.usuario?.id;
        const { passwordActual, nuevaPassword } = req.body;

        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        const passwordOk = await bcrypt.compare(passwordActual, usuario.password);
        if (!passwordOk) {
            return res.status(400).json({
                ok: false,
                mensaje: 'La contraseña actual es incorrecta'
            });
        }

       
        const hashedPassword = await bcrypt.hash(nuevaPassword, 10);


        usuario.password = hashedPassword;
        usuario.debeCambiarPassword = false;
        await usuario.save();

        return res.status(200).json({
            ok: true,
            mensaje: 'Contraseña actualizada exitosamente'
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            mensaje: 'Error al cambiar la contraseña',
            error: error.message
        });
    }
};