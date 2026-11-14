import jwt from 'jsonwebtoken';

export const verificarToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // 1. Añadimos el espacio 'Bearer ' para mayor seguridad
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                ok: false, 
                mensaje: "Acceso denegado. Token no válido o ausente." 
            });
        }

        const token = authHeader.split(' ')[1];

        const payloadDecodificado = jwt.verify(token, process.env.JWT_SECRET);

        req.usuario = payloadDecodificado;

        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                ok: false, 
                mensaje: "El token ha expirado. Inicie sesión nuevamente." 
            });
        }
        return res.status(401).json({ 
            ok: false, 
            mensaje: "Token inválido." 
        });
    }
};