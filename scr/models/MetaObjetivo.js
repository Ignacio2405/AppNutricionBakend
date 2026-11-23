import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const registroSchema = new Schema(
  {
    date: {
      type: Date,
      default: Date.now,
    },
    completed: {
      type: Schema.Types.Mixed, // Permite booleano (true/false) o porcentaje numérico (0-100)
      default: false,
    },
  },
  { _id: false }
);

const objetivoItemSchema = new Schema(
  {
    description: {
      type: String,
      required: [true, "La descripción del objetivo es obligatoria"],
      trim: true,
    },
    frecuenciaEsperada: {
      type: String,
      enum: ["diaria", "semanal"],
      default: "diaria",
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["activo", "cumplido", "pausado"],
      default: "activo",
      lowercase: true,
      trim: true,
    },
    registro: {
      type: [registroSchema],
      default: [],
    },
  },
  { _id: true }
);

const metaObjetivoSchema = new Schema(
  {
    pacienteId: {
      type: Types.ObjectId,
      ref: "Paciente",
      required: [true, "La referencia al paciente es obligatoria"],
    },
    consultaId: {
      type: Types.ObjectId,
      ref: "Consulta",
      default: null,
    },
    objetivos: {
      type: [objetivoItemSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "Debe incluir al menos un objetivo",
      },
    },
    activo: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

export const MetaObjetivo = model("MetaObjetivo", metaObjetivoSchema);