import mongoose from 'mongoose';
import { RolEnum } from '../enum/Rol.enum.js'; 

const usuarioSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, 'El email es obligatorio'],
            unique: true, 
            lowercase: true,
            trim: true,
            match: [/\S+@\S+\.\S+/, 'El email debe tener un formato válido'],
        },
        user: {
            type: String,
            required: [true, 'El nombre de usuario es obligatorio'],
            unique: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'La contraseña es obligatoria'],
        },
        rol: {
            type: String,
            enum: Object.values(RolEnum),
            default: RolEnum.USER        
        },
        debeCambiarPassword: {
            type: Boolean,
            default: true, 
        },
        activo: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);
export const Usuario = mongoose.model('Usuario', usuarioSchema);