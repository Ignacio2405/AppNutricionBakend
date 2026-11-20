
import mongoose from 'mongoose';

const AntropometriaSchema = new mongoose.Schema(
    {
        // Mediciones ingresadas por el profesional
        mediciones: {
            peso: {
                type: Number,
                min: 0
            },
            talla: {
                type: Number,
                min: 0
            },
            cuello: Number,
            brazo: Number,
            cintura: Number,
            cadera: Number,
            pTricipital: Number,
            pBicipital: Number,
            pSubescapular: Number,
            pSuprailiaco: Number
        },

        // Resultados que posteriormente calculará Python
        resultados: {
            imc: Number,
            porcentajeMG: Number,
            porcentajeMM: Number,
            mBasal: Number,
            bodyAge: Number,
            grVisceral: Number,
            icc: Number
        }
    },
    { _id: false }
);

const ConsultaMedicaSchema = new mongoose.Schema(
    {
        paciente: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Paciente',
            required: true
        },

        medico: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medico',
            required: true
        },

        turno: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Turno'
        },

        fecha: {
            type: Date,
            default: Date.now
        },

        hora: {
            type: String,
            required: true
        },

        antropometria: {
            type: AntropometriaSchema,
            required: true
        },

        observaciones: {
            type: String,
            trim: true
        },

        activo: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

export const ConsultaMedica = mongoose.model(
    'ConsultaMedica',
    ConsultaMedicaSchema,
    'consultasMedicas'
);
