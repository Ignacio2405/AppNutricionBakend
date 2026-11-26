const zonaHorariaArgentina = 'America/Argentina/Buenos_Aires';
const formatoFechaArgentina = new Intl.DateTimeFormat('en-CA', {
  timeZone: zonaHorariaArgentina,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export const normalizarFechaCalendarioArgentina = (valor) => {
  if (valor === undefined || valor === null || valor === '') return null;

  if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const fechaUtc = new Date(`${valor}T00:00:00.000Z`);
    return !Number.isNaN(fechaUtc.getTime()) &&
      fechaUtc.toISOString().slice(0, 10) === valor
      ? valor
      : null;
  }

  const fecha = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(fecha.getTime())
    ? null
    : formatoFechaArgentina.format(fecha);
};

export const obtenerFechaHoyArgentina = () =>
  formatoFechaArgentina.format(new Date());
