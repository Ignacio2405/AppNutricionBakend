import { Agenda } from '../models/Agenda.js';

const getAgenda = async (req, res) => {    
   try {
        const { medico, diaSemana } = req.query;
        const filtro = { activo: true }; 

        if (medico) filtro.medico = medico;
        if (diaSemana) filtro.diaSemana = diaSemana;

        const horario = await Agenda.find(filtro)
            .populate('medico');    

        return res.status(200).json({
            ok: true,
            mensaje: 'Agenda obtenida correctamente',
            data: horario
        });    

   } catch (error) {
        return res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener la agenda',
            error: error.message
        });    
   }
};

const createAgenda = async (req, res) => {
    try {
        const nuevoHorario = await Agenda.create(req.body);

        return res.status(201).json({
            ok: true,
            mensaje: 'Agenda creada correctamente',
            data: nuevoHorario
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            mensaje: 'Error al crear la Agenda',
            error: error.message
        });
    }    
};

const updateAgenda = async (req, res) => {
    try {
        const { id } = req.params;
        
        const agendaActualizado = await Agenda.findOneAndUpdate(
            { _id: id, activo: true },
            { $set: req.body },
            { 
                returnDocument: 'after', 
                runValidators: true,
                context: 'query'
            }
        );    

        if (!agendaActualizado) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Horario de atención no encontrado o inactivo',
                data: null
            });
        }

        return res.status(200).json({
            ok: true,
            mensaje: 'Horario de atención actualizado correctamente',
            data: agendaActualizado
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            mensaje: 'Error al actualizar la agenda',
            error: error.message
        });
    }    
};


const deleteAgenda = async (req, res) => {
    try {
        const { id } = req.params;

        const agendaInactivado = await Agenda.findByIdAndUpdate(
            id,
            { $set: { activo: false } },
            { returnDocument: 'after' }
        );

        if (!agendaInactivado) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Agenda no encontrado'
            });
        }

        return res.status(200).json({
            ok: true,
            mensaje: 'Agenda dada de baja correctamente',
            data: agendaInactivado
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            mensaje: 'Error al dar de baja la agenda',
            error: error.message
        });
    }
};

export {getAgenda, createAgenda, updateAgenda, deleteAgenda };