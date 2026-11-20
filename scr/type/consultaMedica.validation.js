
import { z } from 'zod';

const antropometriaSchema = z.object({
    mediciones: z.object({
        peso: z.number().positive().optional(),
        talla: z.number().positive().optional(),
        cuello: z.number().positive().optional(),
        brazo: z.number().positive().optional(),
        cintura: z.number().positive().optional(),
        cadera: z.number().positive().optional(),
        pTricipital: z.number().positive().optional(),
        pBicipital: z.number().positive().optional(),
        pSubescapular: z.number().positive().optional(),
        pSuprailiaco: z.number().positive().optional()
    }),

    resultados: z.object({}).optional()
});

export const crearConsultaSchema = z.object({
    body: z.object({
        paciente: z.string().regex(/^[a-f\d]{24}$/i, 'ID de paciente inválido'),

        medico: z.string().regex(/^[a-f\d]{24}$/i, 'ID de médico inválido'),

        turno: z.string().regex(/^[a-f\d]{24}$/i, 'ID de turno inválido').optional(),

        fecha: z.coerce.date().optional(),

        hora: z.string().min(1, 'La hora es obligatoria'),

        antropometria: antropometriaSchema,

        observaciones: z.string().trim().optional()
    })
});
