import mongoose from 'mongoose';
import { EstadoTurnoEnum } from '../enum/EstadoTurno.enum.js';

const TurnoSchema = new mongoose.Schema(
  {
    paciente: {
      type: mongoose.Schema.Types.Mixed, 
      required: true,
    },
    medico: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medico',
      required: true,
    },
    fecha: {
      type: Date,
      required: true,
    },
    hora: {
      type: String,
      required: true,
    },  
    estado: {
      type: String,
      enum: Object.values(EstadoTurnoEnum),
      default: EstadoTurnoEnum.PENDIENTE,
      required: true,
    },
    observaciones: {
      type: String,
      trim: true,
      default: '',
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
TurnoSchema.index(
  { paciente: 1, fecha: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { paciente: { $type: "objectId" } } 
  }
);

export const Turno = mongoose.model('Turno', TurnoSchema);