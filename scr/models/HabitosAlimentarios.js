import mongoose from "mongoose";
import { NivelActividadFisica, NivelEstres } from "../enum/HabitosAlimentarios.enum.js";

const habitosAlimentariosSchema = new mongoose.Schema(
  {
    pacienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paciente", // Verificá que coincida exactamente con el nombre del modelo de Pacientes
      required: [true, "El paciente es obligatorio"],
    },
    cantidadComidasDiarias: {
      type: Number,
      required: [true, "La cantidad de comidas diarias habituales es obligatoria"],
      min: [1, "Debe ser al menos 1 comida diaria"],
      max: [12, "Verificá la cantidad de comidas diarias"],
    },
    consumoAguaDiarioLitros: {
      type: Number,
      required: [true, "El consumo estimado de agua diaria es obligatorio"],
      min: [0, "El consumo de agua no puede ser negativo"],
      max: [15, "Verificá el consumo de agua en litros"],
    },
    alimentosPreferidos: {
      type: [String],
      default: [],
    },
    alimentosRechazados: {
      type: [String],
      default: [],
    },
    historialDietasPrevias: {
      type: String,
      trim: true,
      maxlength: [1000, "No puede superar los 1000 caracteres"],
      default: "",
    },
    resultadosDietasPrevias: {
      type: String,
      trim: true,
      maxlength: [1000, "No puede superar los 1000 caracteres"],
      default: "",
    },
    nivelActividadFisica: {
     type: String,
        enum: Object.values(NivelActividadFisica ),
        default: NivelActividadFisica.MODERADO  
      },

    horasSuenoNocturno: {
      type: Number,
      min: [0, "Las horas de sueño no pueden ser negativas"],
      max: [24, "Las horas de sueño no pueden superar las 24 horas"],
      default: 7,
    },
    nivelEstres: {
     type: String,
        enum: Object.values(NivelEstres),
        default: NivelEstres.BAJO  
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

// Índice útil para búsquedas rápidas por paciente
habitosAlimentariosSchema.index({ pacienteId: 1 });

export const HabitosAlimentarios = mongoose.model(
  "HabitosAlimentarios",
  habitosAlimentariosSchema
);