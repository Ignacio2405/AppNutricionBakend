import mongoose from 'mongoose';

const MedicamentoSuplementoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true
    },
    dosis: {
      type: String,
      trim: true
    },
    frecuencia: {
      type: String,
      trim: true
    }
  },
  { _id: false }
);

const AntecedentesSchema = new mongoose.Schema(
  {
    obesidad: {
      type: Boolean,
      default: false
    },
    diabetes: {
      type: Boolean,
      default: false
    },
    cardiopatias: {
      type: Boolean,
      default: false
    },
    cancer: {
      type: Boolean,
      default: false
    },
    observaciones: {
      type: String,
      trim: true
    }
  },
  { _id: false }
);

const SaludDigestivaSchema = new mongoose.Schema(
  {
    acidez: {
      type: Boolean,
      default: false
    },
    transitoIntestinal: {
      type: String,
      trim: true
    },
    distension: {
      type: Boolean,
      default: false
    },
    observaciones: {
      type: String,
      trim: true
    }
  },
  { _id: false }
);

const HistorialMedicoSchema = new mongoose.Schema(
  {
    pacienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Paciente',
      required: true,
      unique: true
    },

    patologiasActuales: [
      {
        type: String,
        trim: true
      }
    ],

    antecedentes: {
      type: AntecedentesSchema,
      default: () => ({})
    },

    medicamentosSuplementos: {
      type: [MedicamentoSuplementoSchema],
      default: []
    },

    alergiasIntolerancias: [
      {
        type: String,
        trim: true
      }
    ],

    saludDigestiva: {
      type: SaludDigestivaSchema,
      default: () => ({})
    },

    observacionesGinecoObstetricas: {
      type: String,
      trim: true
    },

    activo: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export const HistorialMedico = mongoose.model(
  'HistorialMedico',
  HistorialMedicoSchema,
  'historialesMedicos'
);