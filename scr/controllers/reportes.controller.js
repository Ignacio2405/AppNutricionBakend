import mongoose from "mongoose";
import { Paciente } from "../models/Paciente.js";
import { ConsultaMedica } from "../models/Consulta.js";
import { HistorialMedico } from "../models/historialMedico.model.js";
import {ResultadosLaboratorio } from "../models/ResultadosLaboratorio.js";
import { PlanComidas } from "../models/PlanComidas.js";
import { MetaObjetivo } from "../models/MetaObjetivo.js";

const esObjectIdValido = (id) => mongoose.Types.ObjectId.isValid(id);

const construirFiltroPaciente = (pacienteId, desde, hasta, campoFecha = "fecha") => {
  const objectId = new mongoose.Types.ObjectId(pacienteId);
  const filtro = {
    $or: [{ paciente: objectId }, { pacienteId: objectId }],
  };

  if (desde || hasta) {
    filtro[campoFecha] = {};
    if (desde) {
      const fDesde = new Date(`${desde}T00:00:00.000Z`);
      if (!Number.isNaN(fDesde.getTime())) filtro[campoFecha].$gte = fDesde;
    }
    if (hasta) {
      const fHasta = new Date(`${hasta}T23:59:59.999Z`);
      if (!Number.isNaN(fHasta.getTime())) filtro[campoFecha].$lte = fHasta;
    }
    if (Object.keys(filtro[campoFecha]).length === 0) {
      delete filtro[campoFecha];
    }
  }

  return filtro;
};

const extraerPeso = (doc) => {
  const valor =
    doc?.peso ??
    doc?.pesoActual ??
    doc?.pesoKg ??
    doc?.antropometria?.peso ??
    null;
  const num = Number(valor);
  return Number.isFinite(num) && num > 0 ? num : null;
};

const extraerImc = (doc, peso) => {
  const valor = doc?.imc ?? doc?.antropometria?.imc ?? null;
  const num = Number(valor);
  if (Number.isFinite(num) && num > 0) return Number(num.toFixed(2));

  const tallaCm = Number(doc?.tallaCm ?? doc?.alturaCm ?? doc?.talla ?? 0);
  if (peso && tallaCm > 0) {
    const metros = tallaCm > 3 ? tallaCm / 100 : tallaCm;
    return Number((peso / (metros * metros)).toFixed(2));
  }
  return null;
};

export const getInformePaciente = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const { desde, hasta } = req.query;

    if (!esObjectIdValido(pacienteId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID del paciente no es válido.",
      });
    }

    const paciente = await Paciente.findById(pacienteId).lean();
    if (!paciente) {
      return res.status(404).json({
        ok: false,
        mensaje: "Paciente no encontrado.",
      });
    }

    const filtroConsultas = construirFiltroPaciente(pacienteId, desde, hasta, "fecha");
    const filtroSimple = {
      $or: [
        { paciente: new mongoose.Types.ObjectId(pacienteId) },
        { pacienteId: new mongoose.Types.ObjectId(pacienteId) },
      ],
    };

    const [
      consultas,
      historiales,
      laboratorios,
      planesComidas,
      metasObjetivos,
    ] = await Promise.all([
      ConsultaMedica.find(filtroConsultas).sort({ fecha: 1, createdAt: 1 }).lean(),
      HistorialMedico.find(filtroSimple).sort({ createdAt: -1 }).lean(),
      ResultadosLaboratorio.find(filtroSimple).sort({ fecha: -1, createdAt: -1 }).lean(),
      PlanComidas.find(filtroSimple).sort({ createdAt: -1 }).lean(),
      MetaObjetivo.find(filtroSimple).sort({ createdAt: -1 }).lean(),
    ]);

    // Serie de evolución cronológica a partir de consultas
    const evolucion = consultas.map((c) => {
      const peso = extraerPeso(c);
      const imc = extraerImc(c, peso);
      return {
        _id: c._id,
        fecha: c.fecha || c.createdAt,
        peso,
        imc,
        motivo: c.motivo || c.motivoConsulta || c.observaciones || "",
        diagnostico: c.diagnostico || c.indicaciones || "",
      };
    });

    const puntosConPeso = evolucion.filter((item) => item.peso !== null);
    const pesoInicial = puntosConPeso.length > 0 ? puntosConPeso[0].peso : null;
    const pesoActual =
      puntosConPeso.length > 0
        ? puntosConPeso[puntosConPeso.length - 1].peso
        : extraerPeso(paciente);

    const variacionPeso =
      pesoInicial !== null && pesoActual !== null
        ? Number((pesoActual - pesoInicial).toFixed(2))
        : null;

    const totalMetas = metasObjetivos.length;
    const metasCompletadas = metasObjetivos.filter((m) => {
      const estado = String(m?.estado || m?.status || "").toUpperCase();
      return Boolean(m?.completada) || estado === "COMPLETADA" || estado === "CUMPLIDA";
    }).length;

    const resumen = {
      totalConsultas: consultas.length,
      pesoInicial,
      pesoActual,
      variacionPeso,
      totalMetas,
      metasCompletadas,
      porcentajeMetas:
        totalMetas > 0 ? Math.round((metasCompletadas / totalMetas) * 100) : 0,
    };

    return res.status(200).json({
      ok: true,
      mensaje: "Informe del paciente generado correctamente.",
      data: {
        generadoEn: new Date().toISOString(),
        rango: { desde: desde || null, hasta: hasta || null },
        paciente,
        resumen,
        evolucion,
        consultas: [...consultas].reverse(),
        historialMedico: historiales[0] || null,
        historiales,
        ultimoLaboratorio: laboratorios[0] || null,
        laboratorios,
        planVigente: planesComidas[0] || null,
        planesComidas,
        metasObjetivos,
      },
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: "Error al generar el informe del paciente.",
      error: error.message,
    });
  }
};