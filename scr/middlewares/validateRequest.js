
export const validateRequest = (schema) => {
    return (req, res, next) => {
        const resultado = schema.safeParse({
            body: req.body,
            params: req.params,
            query: req.query
        });

        if (!resultado.success) {
            const errores = resultado.error.issues.map((error) => ({
                campo: error.path.join('.'),
                mensaje: error.message
            }));

            return res.status(400).json({
                ok: false,
                mensaje: 'Error de validación',
                errores
            });
        }

        req.body = resultado.data.body;
        req.params = resultado.data.params;
        req.query = resultado.data.query;

        next();
    };
};
