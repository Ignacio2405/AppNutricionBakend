import mongoose from 'mongoose';
import { TelefonoEnum } from '../enum/Paciente.enum.js';

const obraSocialSchema = new mongoose.Schema({
    razonSocial: {
        type: String,
        required: [true, 'La Razon Social es obligatoria'],
        uppercase: true,
    }, 
    cuit: {
        type: String,
        required: [true, 'El número de cuit es obligatorio'],
        unique: true 
    }, 
    direccion: {
        type: String,
        required: [true, 'La direccion es obligatoria']
    },
    telefono: {
        tipo: {
            type: String,
            enum: Object.values(TelefonoEnum),
            default: TelefonoEnum.CELULAR
        }
    },
    activo: {
        type: Boolean,
        default: true,
        select: false
    }
}, {
    timestamps: true,
});

export const ObraSocial = mongoose.model('ObraSocial', obraSocialSchema);