const LIMITE_POR_DEFECTO = 20;
const LIMITE_MAXIMO = 100;

export const obtenerParametrosPaginacion = (query = {}) => {
  const parseEnteroPositivo = (valor, valorPorDefecto) => {
    if (valor === undefined) return valorPorDefecto;
    if (
      (typeof valor !== 'string' && typeof valor !== 'number') ||
      !/^\d+$/.test(String(valor))
    ) {
      return null;
    }

    const numero = Number(valor);
    return Number.isSafeInteger(numero) && numero > 0 ? numero : null;
  };

  const page = parseEnteroPositivo(query.page, 1);
  const limiteSolicitado = parseEnteroPositivo(query.limit, LIMITE_POR_DEFECTO);
  if (page === null || limiteSolicitado === null) return null;

  const limit = Math.min(limiteSolicitado, LIMITE_MAXIMO);
  const skip = (page - 1) * limit;
  if (!Number.isSafeInteger(skip)) return null;

  return { page, limit, skip };
};

export const crearMetadataPaginacion = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

export const ejecutarConsultaPaginada = async (
  consulta,
  modelo,
  filtro,
  paginacion,
) => {
  const [data, total] = await Promise.all([
    consulta.skip(paginacion.skip).limit(paginacion.limit).exec(),
    modelo.countDocuments(filtro).exec(),
  ]);

  return {
    data,
    pagination: crearMetadataPaginacion(
      paginacion.page,
      paginacion.limit,
      total,
    ),
  };
};
