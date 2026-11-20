import mongoose from 'mongoose';
import { DiasSemanasEnum } from '../enum/DiasSemanas.enum.js';


export const horaAMinutos = (hora) => {
  const [h = 0, m = 0] = hora.split(':').map(Number);
  return h * 60 + m;
};
const AgendaSchema = new mongoose.Schema({
    medico: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Medico", 
        required: true 
    },
    diaSemana: { 
        type: String, 
        enum: Object.values(DiasSemanasEnum), 
        required: true 
    },
    horaInicio: { 
        type: String, 
        required: true 
    }, 
    horaFin: { 
        type: String, 
        required: true,
        validate: {
            validator: function (value) {
                const horaInicio = this.horaInicio || (this.getUpdate && this.getUpdate().$set?.horaInicio);
                if (!horaInicio || !value) return true;
                return horaAMinutos(value) > horaAMinutos(horaInicio);
            },
            message: 'La horaFin debe ser posterior a la horaInicio'
        },
    },
    duracionTurnoMinutos: { 
        type: Number, 
        default: 30 
    }, 
    activo: { 
        type: Boolean, 
        default: true 
    }
}, {
    timestamps: true
});

export const Agenda = mongoose.model("Agenda", AgendaSchema);