import mongoose from "mongoose";

const { Schema, model } = mongoose;

const filaAlimentoSchema = new Schema(
  {
    categoria: {
      type: String,
      required: [true, "La categoría del alimento es obligatoria."],
      trim: true,
      uppercase: true, // Ej: "YOGURT/LECHE", "QUESO", "CARNE"
    },
    seleccion: {
      type: String,
      required: [true, "La selección del alimento es obligatoria."],
      trim: true,
    },
    metodoPreparacion: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const objetivosMacrosSchema = new Schema(
  {
    caloriasDiarias: {
      type: Number,
      min: [0, "Las calorías diarias no pueden ser negativas."],
      default: null,
    },
    proteinasGramos: {
      type: Number,
      min: [0, "Los gramos de proteína no pueden ser negativos."],
      default: null,
    },
    carbohidratosGramos: {
      type: Number,
      min: [0, "Los gramos de carbohidratos no pueden ser negativos."],
      default: null,
    },
    grasasGramos: {
      type: Number,
      min: [0, "Los gramos de grasa no pueden ser negativos."],
      default: null,
    },
  },
  { _id: false }
);

const planComidasSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Paciente", // Ajustá al nombre exacto con el que registraste el modelo de Paciente
      required: [true, "El ID del paciente es obligatorio."],
      index: true,
    },
    consultationId: {
      type: Schema.Types.ObjectId,
      ref: "ConsultaMedica",
      default: null,
    },
    titulo: {
      type: String,
      required: [true, "El título del plan es obligatorio."],
      trim: true,
    },
    fechaEntrega: {
      type: Date,
      default: Date.now,
    },
    fechaInicioVigencia: {
      type: Date,
      required: [true, "La fecha de inicio de vigencia es obligatoria."],
    },
    fechaFinRevision: {
      type: Date,
      default: null,
    },
    planActivo: {
      type: Boolean,
      default: true,
      index: true,
    },
    objetivosMacros: {
      type: objetivosMacrosSchema,
      default: () => ({}),
    },
    grupoDeAlimentos: {
      type: [filaAlimentoSchema],
      default: [],
    },
    advertencias: {
      type: [String],
      default: [
        "Descremado NO siempre es sinónimo de Light. Se sugiere como elección alimentos rotulados como Descremado y/o aquellos productos Light con la leyenda bajo en grasas o grasas 0%.",
        "La cocción del huevo y la carne debe ser completa. No ingerirlos crudos o semicruidos.",
        "Las hortalizas y frutas que se ingieren crudas, se recomienda lavarlas con abundante agua segura, después de una correcta higiene de manos. Si se fraccionan sobre tablas, que las mismas, sean exclusivas para estos alimentos, o bien utilizar otro elemento que NO sea de madera ni de plástico.",
      ],
    },
    activo: {
      type: Boolean,
      default: true, // Borrado lógico coherente con el resto del proyecto
    },
  },
  {
    timestamps: true,
  }
);

// Índice compuesto útil para buscar rápido el plan vigente de un paciente
planComidasSchema.index({ patientId: 1, planActivo: 1, activo: 1 });

export const PlanComidas = model("PlanComidas", planComidasSchema);