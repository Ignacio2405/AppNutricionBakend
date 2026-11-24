import mongoose from 'mongoose';
import { CategoriaMotivo, TipoExcepcion } from '../enum/ExepcionesTurno.enum.js';

const ExcepcionAgendaSchema = new mongoose.Schema(
  {
    medico: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medico',
      required: true,
    },
    fecha: {
      type: Date,
      required: true,
    },
    tipo: {
      type: String,
      enum: Object.values(TipoExcepcion),
      required: true,
    },
    horaInicio: {
      type: String,
    },
    horaFin: {
      type: String,
    },
    duracionTurnoMinutos: {
      type: Number,
      default: 30,
    },
    motivo: {
      type: String,
      enum: Object.values(CategoriaMotivo),
      required: true,
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

ExcepcionAgendaSchema.pre('save', function () {
  if (this.fecha) {
    const d = new Date(this.fecha);
    if (!Number.isNaN(d.getTime())) {
      d.setUTCHours(0, 0, 0, 0);
      this.fecha = d;
    }
  }
});

// Índice compuesto único para excepciones activas por médico y fecha
ExcepcionAgendaSchema.index(
  { medico: 1, fecha: 1 },
  { unique: true, partialFilterExpression: { activo: true } }
);

export const ExcepcionAgenda = mongoose.model('ExcepcionAgenda', ExcepcionAgendaSchema);