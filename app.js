import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import 'dotenv/config';
import { conectarDB } from './scr/config/db.js'; 
import { limitadorGlobal } from './scr/middlewares/rateLimit.middleware.js';
// importacion de Rutas
import authRoutes from './scr/routes/auth.routes.js';
import pacienteRoutes from './scr/routes/paciente.routes.js';
import obraSocial from './scr/routes/obraSocial.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de seguridad y utilidad
app.use(helmet());

const originesPermitidos = ['http://localhost:5173', 'https://mi-pagina.com'];

app.use(cors({
    origin: function (origen, callback) {
        if (!origen || originesPermitidos.includes(origen)) {
            callback(null, true);
        } else {
            callback(new Error('Bloqueado por politicas CORS'));
        }
    }
}));

app.use(morgan('dev'));
app.use(limitadorGlobal);
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ mensaje: '¡Servidor Express funcionando correctamente!' });
});

// Tus rutas de la API
app.use('/api/login', authRoutes);
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/obraSocial', obraSocial);


const iniciarServidor = async () => {
    try {
    
        await conectarDB();

        // Una vez conectada la BD, recién encendemos el servidor Express
        app.listen(PORT, () => {
            console.log(`Servidor Express corriendo en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('No se pudo iniciar la aplicación debido a un error en la Base de Datos.');
        process.exit(1); 
    }
};

iniciarServidor();

export default app;