import mongoose from "mongoose";
import { Pago } from "../models/Pago.js";
import { EstadoPago } from "../enum/Pago.enum.js";
import {
  crearMetadataPaginacion,
  obtenerParametrosPaginacion,
} from "../utils/paginacion.js";

export const crearPago = async (req, res) => {
  try {
    const {
      paciente,
      turno,
      fecha,
      monto,
      metodoPago,
      estado,
      concepto,
      observaciones,
    } = req.body;

    if (!paciente || !mongoose.Types.ObjectId.isValid(paciente)) {
      return res.status(400).json({
        ok: false,
        mensaje: "Debe seleccionar un paciente válido.",
      });
    }

    const montoNum = Number(monto);
    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "El monto del pago debe ser mayor a 0.",
      });
    }

    const nuevoPago = await Pago.create({
      paciente,
      turno: turno && mongoose.Types.ObjectId.isValid(turno) ? turno : null,
      fecha: fecha || new Date(),
      monto: montoNum,
      metodoPago,
      estado: estado || EstadoPago.PAGADO,
      concepto: concepto || "Consulta nutricional",
      observaciones: observaciones || "",
      activo: true,
    });

    const pagoPopulado = await Pago.findById(nuevoPago._id)
      .populate("paciente", "nombre apellido dni")
      .lean();

    return res.status(201).json({
      ok: true,
      mensaje: "Pago registrado correctamente.",
      data: pagoPopulado || nuevoPago,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: "Error al registrar el pago.",
      error: error.message,
    });
  }
};

export const obtenerPagos = async (req, res) => {
  try {
    const { paciente, estado, desde, hasta } = req.query;
    const filtro = { activo: true };
    const paginacion = obtenerParametrosPaginacion(req.query);
    if (!paginacion) {
      return res.status(400).json({
        ok: false,
        mensaje: "Los parámetros page y limit deben ser enteros positivos.",
      });
    }

    if (paciente && mongoose.Types.ObjectId.isValid(paciente)) {
      filtro.paciente = new mongoose.Types.ObjectId(paciente);
    }

    if (estado) {
      filtro.estado = String(estado).toUpperCase();
    }

    if (desde || hasta) {
      filtro.fecha = {};
      if (desde) {
        const fDesde = new Date(`${desde}T00:00:00.000Z`);
        if (!Number.isNaN(fDesde.getTime())) filtro.fecha.$gte = fDesde;
      }
      if (hasta) {
        const fHasta = new Date(`${hasta}T23:59:59.999Z`);
        if (!Number.isNaN(fHasta.getTime())) filtro.fecha.$lte = fHasta;
      }
      if (Object.keys(filtro.fecha).length === 0) {
        delete filtro.fecha;
      }
    }

    const [pagos, resumenPagos] = await Promise.all([
      Pago.find(filtro)
        .populate("paciente", "nombre apellido dni")
        .sort({ fecha: -1, createdAt: -1, _id: -1 })
        .skip(paginacion.skip)
        .limit(paginacion.limit)
        .lean(),
      Pago.aggregate([
        { $match: filtro },
        {
          $group: {
            _id: null,
            totalRegistros: { $sum: 1 },
            totalCobrado: {
              $sum: {
                $cond: [
                  { $eq: ["$estado", EstadoPago.PAGADO] },
                  { $ifNull: ["$monto", 0] },
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);
    const total = resumenPagos[0]?.totalRegistros || 0;
    const totalCobrado = resumenPagos[0]?.totalCobrado || 0;

    return res.status(200).json({
      ok: true,
      mensaje: "Pagos obtenidos exitosamente.",
      data: pagos,
      pagination: crearMetadataPaginacion(
        paginacion.page,
        paginacion.limit,
        total,
      ),
      resumen: {
        totalRegistros: total,
        totalCobrado: Number(Number(totalCobrado).toFixed(2)),
      },
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener los pagos.",
      error: error.message,
    });
  }
};

export const anularPago = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID del pago no es válido.",
      });
    }

    const pagoActualizado = await Pago.findByIdAndUpdate(
      id,
      { estado: EstadoPago.ANULADO },
      { new: true },
    )
      .populate("paciente", "nombre apellido dni")
      .lean();

    if (!pagoActualizado) {
      return res.status(404).json({
        ok: false,
        mensaje: "No se encontró el pago indicado.",
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: "Pago anulado correctamente.",
      data: pagoActualizado,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: "Error al anular el pago.",
      error: error.message,
    });
  }
};