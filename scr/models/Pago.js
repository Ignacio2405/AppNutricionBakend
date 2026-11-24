import mongoose from "mongoose";
import { EstadoPago, MetodoPago } from "../enum/Pago.enum.js";

const PagoSchema = new mongoose.Schema(
  {
    paciente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paciente",
      required: true,
    },
    turno: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Turno",
      default: null,
    },
    fecha: {
      type: Date,
      required: true,
      default: Date.now,
    },
    monto: {
      type: Number,
      required: true,
      min: 0,
    },
    metodoPago: {
      type: String,
      enum: Object.values(MetodoPago),
      required: true,
      default: MetodoPago.EFECTIVO,
    },
    estado: {
      type: String,
      enum: Object.values(EstadoPago),
      required: true,
      default: EstadoPago.PAGADO,
    },
    concepto: {
      type: String,
      trim: true,
      default: "Consulta nutricional",
    },
    observaciones: {
      type: String,
      trim: true,
      default: "",
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Pago = mongoose.model("Pago", PagoSchema);