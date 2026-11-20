import mongoose from 'mongoose';
import { TelefonoEnum } from '../enum/Paciente.enum.js';

const medicoSchema = new mongoose.Schema({
    nombre: { 
        type: String, 
        required: [true, 'El nombre es obligatorio'], 
        uppercase: true, trim: true 
    },
    apellido: { 
        type: String, 
        required: [true, 'El apellido es obligatorio'], 
        uppercase: true, trim: true 
    },
    dni: { 
        type: String, 
        required: true, 
        unique: true, 
        match: [/^[0-9]{7,8}$/, 'DNI inválido'] 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true 
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
    obraSocial: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'ObraSocial', 
        default: null }],

    activo: { 
        type: Boolean, 
        default: true 
    }

}, {
    timestamps: true,
});


export const Medico = mongoose.model('Medico', medicoSchema);