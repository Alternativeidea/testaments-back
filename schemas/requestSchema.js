import { myRule, notEmptyString, transformEncodedIntegerArray } from './validation.js'
import vine from '@vinejs/vine'

export const filterSchema = vine.object({
    offset: vine.number().min(0).parse(v => v ?? 0),
    limit: vine.number().min(-1).parse(v => v ?? 50),
    search: vine.string().optional().nullable(),
    status: vine.string().use(myRule()).transform((value) => transformEncodedIntegerArray(value)).optional()
})

export const updateStatusSchema = vine.object({
    status: vine.number().min(1)
})

export const createAppointmentSchema = vine.object({
    time: vine.string().use(notEmptyString()),
    address: vine.string().use(notEmptyString()),
    date: vine.date()
})

export const updateSchema = vine.object({
    action: vine.enum(['edit', 'delete']),
    code: vine.string().optional().nullable()
})
