import mongoose from "mongoose";

const { Schema, model } = mongoose;

const filaAlimentoSchema = new Schema(
  {
    categoria: {
      type: String,
      required: [true, "La categoría del alimento es obligatoria."],
      trim: true,
      uppercase: true, // Ej: "LECHE/YOGURT", "QUESO", "HUEVO", "CARNE", "HORTALIZAS"
    },
    seleccion: {
      type: String,
      required: [true, "La selección de alimentos es obligatoria."],
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

const equivalenciaMomentoSchema = new Schema(
  {
    momento: {
      type: String,
      enum: {
        values: ["DESAYUNO_MERIENDA", "ALMUERZO_CENA", "COLACION"],
        message: "Momento de distribución no válido.",
      },
      required: [true, "El momento de la distribución es obligatorio."],
    },
    rubro: {
      type: String,
      required: [true, "El rubro o grupo de equivalencia es obligatorio."],
      trim: true,
      uppercase: true, // Ej: "LACTEOS", "CEREALES", "FRUTAS", "VEGETALES", "CARNES", "HUEVO", "LEGUMBRES"
    },
    porcionesEquivalencias: {
      type: String,
      required: [true, "La porción o equivalencia es obligatoria."],
      trim: true, // Ej: "1 taza", "3 tostadas mignón", "1½ plato"
    },
    opcionesOPreparaciones: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const recetaEjemploSchema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre de la preparación o receta es obligatorio."],
      trim: true,
    },
    ingredientes: {
      type: String,
      trim: true,
      default: "",
    },
    preparacion: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const planComidasSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Paciente",
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
    tipoPlan: {
      type: String,
      trim: true,
      default: "", // Ej: "Hipercalórico", "Hipocalórico", "Normocalórico"
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
    distribucionEquivalencias: {
      type: [equivalenciaMomentoSchema],
      default: [],
    },
    recetasEjemplos: {
      type: [recetaEjemploSchema],
      default: [],
    },
    recomendacionesGenerales: {
      type: [String],
      default: [],
    },
    advertencias: {
      type: [String],
      default: [
        "Descremado NO siempre es sinónimo de Light. Se sugiere elegir alimentos rotulados como Descremado y/o aquellos productos Light con la leyenda bajo en grasas o grasas 0%.",
        "La cocción del huevo y la carne debe ser completa. No ingerirlos crudos o semicruidos.",
        "Las hortalizas y frutas que se ingieren crudas, se recomienda lavarlas con abundante agua segura, después de una correcta higiene de manos. Si se fraccionan sobre tablas, que las mismas, sean exclusivas para estos alimentos o bien utilizar otro elemento que NO sea de madera ni de plástico.",
      ],
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

planComidasSchema.index({ patientId: 1, planActivo: 1, activo: 1 });

export const PlanComidas = model("PlanComidas", planComidasSchema);