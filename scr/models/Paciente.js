import mongoose from 'mongoose';
import { SexoEnum, TelefonoEnum } from '../enum/Paciente.enum.js'; 


const pacienteSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        uppercase: true,
    },
    apellido: {
        type: String,
        required: [true, 'El apellido es obligatorio'],
        uppercase: true,
    },
    fechaNacimiento: {
        type: Date,
        required: [true, 'La fecha de nacimiento es obligatoria']
    },
    dni: {
        type: String,
        required: [true, 'El DNI del paciente es obligatorio'],
        unique: true,
        match: [/^[0-9]{7,8}$/, 'El DNI debe tener 7 u 8 dígitos'],
    },
    sexo: {
        type: String,
        enum: Object.values(SexoEnum)
    },
    email: {
        type: String,
        required: [true, 'El correo electrónico del paciente es obligatorio'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'El correo electrónico no es válido'],
    },

    usuario: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'Usuario',
       required: true
    },

    telefono: {
        tipo: {
               type: String,
               enum: Object.values(TelefonoEnum),
               default: TelefonoEnum.CELULAR  
        },
        codigoArea: {
            type: String,
            required: true
        },
        numero: {
            type: String,
            required: true
        }
    },

    obraSocial: {
       type: mongoose.Schema.Types.ObjectId,
        ref: 'ObraSocial',
        default: null,
    },

    ocupacion: {
        type: String,
        trim: true
    },

    activo: {
        type: Boolean,
        default: true,
        select: false
    }

}, {
    timestamps: true,
});

export const Paciente = mongoose.model('Paciente', pacienteSchema);