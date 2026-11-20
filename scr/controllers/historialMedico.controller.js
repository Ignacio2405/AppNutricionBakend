import { HistorialMedico } from '../models/historialMedico.model.js';

// 1. Crear un nuevo historial médico
export const crearHistorialMedico = async (req, res) => {
  try {
    const { pacienteId } = req.body;

    // Verificamos si el paciente ya tiene un historial registrado (debido a unique: true)
    const historialExistente = await HistorialMedico.findOne({ pacienteId });
    if (historialExistente) {
      return res.status(400).json({
        ok: false,
        mensaje: historialExistente.activo
          ? 'El paciente ya posee un historial médico activo.'
          : 'El paciente ya posee un historial médico desactivado. Puede reactivarlo o actualizarlo.'
      });
    }

    const nuevoHistorial = new HistorialMedico(req.body);
    await nuevoHistorial.save();

    return res.status(201).json({
      ok: true,
      mensaje: 'Historial médico creado correctamente',
      data: nuevoHistorial
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      mensaje: 'Error al crear el historial médico',
      error: error.message
    });
  }
};

// 2. Obtener todos los historiales médicos activos
export const obtenerHistorialesMedicos = async (req, res) => {
  try {
    const historiales = await HistorialMedico.find({ activo: true })
      .populate('pacienteId', 'nombre apellido dni email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      ok: true,
      data: historiales
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener los historiales médicos',
      error: error.message
    });
  }
};

// 3. Obtener un historial médico por su propio ID (_id)
export const obtenerHistorialMedicoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const historial = await HistorialMedico.findOne({ _id: id, activo: true })
      .populate('pacienteId', 'nombre apellido dni email fechaNacimiento sexo');

    if (!historial) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Historial médico no encontrado'
      });
    }

    return res.status(200).json({
      ok: true,
      data: historial
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener el historial médico',
      error: error.message
    });
  }
};

// 4. Obtener el historial médico directamente por el ID del Paciente (muy útil para el perfil clínico)
export const obtenerHistorialPorPaciente = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const historial = await HistorialMedico.findOne({ pacienteId, activo: true })
      .populate('pacienteId', 'nombre apellido dni email fechaNacimiento sexo');

    if (!historial) {
      return res.status(404).json({
        ok: false,
        mensaje: 'El paciente aún no tiene un historial médico cargado'
      });
    }

    return res.status(200).json({
      ok: true,
      data: historial
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al buscar el historial médico del paciente',
      error: error.message
    });
  }
};

// 5. Actualizar historial médico por ID
export const actualizarHistorialMedico = async (req, res) => {
  try {
    const { id } = req.params;
    // Evitamos que se modifique accidentalmente el pacienteId o el estado activo por esta vía
    const { pacienteId, activo, ...datosActualizados } = req.body;

    const historialActualizado = await HistorialMedico.findOneAndUpdate(
      { _id: id, activo: true },
      datosActualizados,
      { new: true, runValidators: true }
    ).populate('pacienteId', 'nombre apellido dni');

    if (!historialActualizado) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Historial médico no encontrado o inactivo'
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: 'Historial médico actualizado correctamente',
      data: historialActualizado
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      mensaje: 'Error al actualizar el historial médico',
      error: error.message
    });
  }
};

// 6. Eliminar historial médico (Baja lógica: activo = false)
export const eliminarHistorialMedico = async (req, res) => {
  try {
    const { id } = req.params;

    const historialDesactivado = await HistorialMedico.findOneAndUpdate(
      { _id: id, activo: true },
      { activo: false },
      { new: true }
    );

    if (!historialDesactivado) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Historial médico no encontrado o ya fue desactivado'
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: 'Historial médico desactivado correctamente'
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al eliminar el historial médico',
      error: error.message
    });
  }
};