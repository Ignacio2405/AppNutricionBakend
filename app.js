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
import medico from './scr/routes/medico.routes.js';
import agenda from './scr/routes/agenda.routes.js';
import turno from './scr/routes/turno.routes.js';
import consulta from './scr/routes/consultaMedica.routes.js';
import excpecion from './scr/routes/excepcionAgenda.routes.js';
import historialMedico from './scr/routes/historialMedico.routes.js';
import habitoAlimentario from './scr/routes/habitosAlimentarios.routes.js';
import resultadosLaboratorioRoutes from "./scr/routes/resultadosLaboratorio.routes.js";
import planComidasRoutes from "./scr/routes/planComidas.routes.js";
import  MetaObjetivo from './scr/routes/metaObjetivo.routes.js';

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
app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/obraSocial', obraSocial);
app.use('/api/medicos', medico);
app.use('/api/agenda', agenda);
app.use('/api/turno', turno);
app.use('/api/consulta', consulta);
app.use('/api/excepcion', excpecion)
app.use('/api/historial-medico', historialMedico);
app.use('/api/habitos', habitoAlimentario);
app.use("/api/resultados-laboratorio", resultadosLaboratorioRoutes);
app.use("/api/planes-comidas", planComidasRoutes);
app.use('/api/metas-objetivos', MetaObjetivo);


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