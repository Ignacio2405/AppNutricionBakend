import { ConsultaMedica } from '../models/Consulta.js';
import { Paciente } from '../models/Paciente.js';

const PYTHON_API_URL =
  process.env.PYTHON_CALC_URL || 'http://127.0.0.1:8000/calcular-antropometria';
const API_TOKEN = process.env.API_TOKEN || '';

const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return null;
  const nacimiento = new Date(fechaNacimiento);
  if (Number.isNaN(nacimiento.getTime())) return null;

  const hoy = new Date();
  let edad = hoy.getUTCFullYear() - nacimiento.getUTCFullYear();
  const mesDiff = hoy.getUTCMonth() - nacimiento.getUTCMonth();
  if (
    mesDiff < 0 ||
    (mesDiff === 0 && hoy.getUTCDate() < nacimiento.getUTCDate())
  ) {
    edad--;
  }
  return edad;
};

const formatearFechaIso = (fechaNacimiento) => {
  if (!fechaNacimiento) return '';
  if (
    typeof fechaNacimiento === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)
  ) {
    return fechaNacimiento;
  }
  const d = new Date(fechaNacimiento);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

const extraerMediciones = (datos = {}) => {
  const fuente =
    datos?.antropometria?.mediciones &&
    typeof datos.antropometria.mediciones === 'object'
      ? datos.antropometria.mediciones
      : datos?.mediciones && typeof datos.mediciones === 'object'
        ? datos.mediciones
        : datos;

  return {
    peso: fuente.peso ?? null,
    talla: fuente.talla ?? null,
    cuello: fuente.cuello ?? null,
    brazo: fuente.brazo ?? null,
    cintura: fuente.cintura ?? null,
    cadera: fuente.cadera ?? null,
    pTricipital: fuente.pTricipital ?? null,
    pBicipital: fuente.pBicipital ?? null,
    pSubescapular: fuente.pSubescapular ?? null,
    pSuprailiaco: fuente.pSuprailiaco ?? null,
  };
};

const normalizarResultados = (raw = {}) => {
  const fuente =
    raw?.resultados && typeof raw.resultados === 'object'
      ? raw.resultados
      : raw?.antropometria?.resultados &&
          typeof raw.antropometria.resultados === 'object'
        ? raw.antropometria.resultados
        : raw?.data && typeof raw.data === 'object'
          ? raw.data
          : raw;

  return {
    imc: fuente.imc ?? null,
    porcentajeMG: fuente.porcentajeMG ?? null,
    porcentajeMM: fuente.porcentajeMM ?? null,
    mBasal: fuente.mBasal ?? null,
    bodyAge: fuente.bodyAge ?? null,
    grVisceral: fuente.grVisceral ?? null,
    icc: fuente.icc ?? null,
  };
};

const construirPayloadAntropometria = async (datos) => {
  const pacienteDoc =
    datos.paciente && typeof datos.paciente === 'object'
      ? datos.paciente
      : datos.paciente
        ? await Paciente.findById(datos.paciente).lean()
        : null;

  const fechaNacStr = formatearFechaIso(
    pacienteDoc?.fechaNacimiento || datos.fechaNacimiento,
  );

  return {
    paciente: {
      sexo: pacienteDoc?.sexo || datos.sexo || '',
      edad:
        datos.edad ??
        calcularEdad(pacienteDoc?.fechaNacimiento || datos.fechaNacimiento),
      fechaNacimiento: fechaNacStr,
    },
    mediciones: extraerMediciones(datos),
  };
};

const solicitarCalculosPython = async (payload) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  const headers = {
    'Content-Type': 'application/json',
  };

  if (API_TOKEN) {
    headers.Authorization = `Bearer ${API_TOKEN}`;
    headers['X-API-Key'] = API_TOKEN;
  }

  try {
    const response = await fetch(PYTHON_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const textoError = await response.text().catch(() => '');
      throw new Error(
        `Error en microservicio Python (${response.status}): ${textoError || response.statusText}`,
      );
    }

    const json = await response.json();
    return normalizarResultados(json);
  } finally {
    clearTimeout(timeoutId);
  }
};

export const crearConsultaService = async (datos) => {
  const mediciones = extraerMediciones(datos);
  const payloadAntropometria = await construirPayloadAntropometria({
    ...datos,
    antropometria: {
      ...(datos.antropometria || {}),
      mediciones,
    },
  });

  const resultadosCalculo = await solicitarCalculosPython(payloadAntropometria);

  const consulta = new ConsultaMedica({
    ...datos,
    antropometria: {
      ...(datos.antropometria || {}),
      mediciones,
      resultados: resultadosCalculo,
    },
  });

  return await consulta.save();
};

export const obtenerConsultasService = async () => {
  return await ConsultaMedica.find({ activo: true })
    .populate('paciente')
    .populate('medico')
    .populate('turno')
    .sort({ fecha: -1 });
};

export const obtenerConsultaPorIdService = async (id) => {
  return await ConsultaMedica.findById(id)
    .populate('paciente')
    .populate('medico')
    .populate('turno');
};

export const actualizarConsultaService = async (id, datos) => {
  const consultaActual = await ConsultaMedica.findById(id).lean();
  if (!consultaActual) {
    return null;
  }

  const medicionesActuales = extraerMediciones(consultaActual);
  const medicionesNuevas = extraerMediciones(datos);

  const tieneMedicionesEnBody =
    Boolean(datos?.antropometria?.mediciones) ||
    Boolean(datos?.mediciones) ||
    [
      'peso',
      'talla',
      'cuello',
      'brazo',
      'cintura',
      'cadera',
      'pTricipital',
      'pBicipital',
      'pSubescapular',
      'pSuprailiaco',
    ].some((campo) => datos[campo] !== undefined);

  const datosActualizacion = { ...datos };

  if (tieneMedicionesEnBody) {
    const medicionesCombinadas = {
      ...medicionesActuales,
      ...Object.fromEntries(
        Object.entries(medicionesNuevas).filter(([, v]) => v !== undefined),
      ),
    };

    const payloadAntropometria = await construirPayloadAntropometria({
      ...consultaActual,
      ...datos,
      paciente: datos.paciente || consultaActual.paciente,
      antropometria: {
        ...(consultaActual.antropometria || {}),
        ...(datos.antropometria || {}),
        mediciones: medicionesCombinadas,
      },
    });

    const resultadosCalculo =
      await solicitarCalculosPython(payloadAntropometria);

    datosActualizacion.antropometria = {
      ...(consultaActual.antropometria || {}),
      ...(datos.antropometria || {}),
      mediciones: medicionesCombinadas,
      resultados: resultadosCalculo,
    };
  }

  return await ConsultaMedica.findByIdAndUpdate(id, datosActualizacion, {
    new: true,
    runValidators: true,
  });
};

export const eliminarConsultaService = async (id) => {
  return await ConsultaMedica.findByIdAndUpdate(
    id,
    { activo: false },
    { new: true },
  );
};