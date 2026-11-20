import mongoose from "mongoose";

const resultadosLaboratorioSchema = new mongoose.Schema(
  {
    pacienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paciente", // Verificá que coincida exactamente con el nombre del modelo de Pacientes
      required: [true, "El paciente es obligatorio"],
    },
    fechaEstudio: {
      type: Date,
      default: Date.now,
    },
    glucemia: {
      type: Number,
      min: [0, "La glucemia no puede ser negativa"],
      max: [1500, "Verificá el valor de glucemia (mg/dL)"],
      default: null,
    },
    colesterolTotal: {
      type: Number,
      min: [0, "El colesterol total no puede ser negativo"],
      max: [1500, "Verificá el valor de colesterol total (mg/dL)"],
      default: null,
    },
    colesterolHdl: {
      type: Number,
      min: [0, "El colesterol HDL no puede ser negativo"],
      max: [500, "Verificá el valor de colesterol HDL (mg/dL)"],
      default: null,
    },
    colesterolLdl: {
      type: Number,
      min: [0, "El colesterol LDL no puede ser negativo"],
      max: [1500, "Verificá el valor de colesterol LDL (mg/dL)"],
      default: null,
    },
    trigliceridos: {
      type: Number,
      min: [0, "Los triglicéridos no pueden ser negativos"],
      max: [5000, "Verificá el valor de triglicéridos (mg/dL)"],
      default: null,
    },
    hemoglobinaGlicosilada: {
      type: Number,
      min: [0, "La hemoglobina glicosilada no puede ser negativa"],
      max: [25, "Verificá el valor de HbA1c (%)"],
      default: null,
    },
    tsh: {
      type: Number,
      min: [0, "La TSH no puede ser negativa"],
      max: [200, "Verificá el valor de TSH (mUI/L o µUI/mL)"],
      default: null,
    },
    observacionesLaboratorio: {
      type: String,
      trim: true,
      maxlength: [1500, "No puede superar los 1500 caracteres"],
      default: "",
    },
    dietaryRecall24h: {
      type: String,
      trim: true,
      maxlength: [3000, "No puede superar los 3000 caracteres"],
      default: "",
    },
    notasNutricionista: {
      type: String,
      trim: true,
      maxlength: [2000, "No puede superar los 2000 caracteres"],
      default: "",
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

// Índice para consultas rápidas por paciente y orden cronológico
resultadosLaboratorioSchema.index({ pacienteId: 1, fechaEstudio: -1 });

export const ResultadosLaboratorio = mongoose.model(
  "ResultadosLaboratorio",
  resultadosLaboratorioSchema
);