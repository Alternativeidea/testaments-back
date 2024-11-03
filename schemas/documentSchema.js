import vine from '@vinejs/vine'
import { myRule, transformEncodedIntegerArray, transformEncodedStringArray } from './validation.js'

export const filterSchema = vine.object({
    offset: vine.number().min(0).parse(v => v ?? 0),
    limit: vine.number().min(-1).parse(v => v ?? 50),
    search: vine.string().optional().nullable(),
    status: vine.string().use(myRule()).transform((value) => transformEncodedIntegerArray(value)).optional(),
    orderBy: vine.string().transform((value) => transformEncodedStringArray(value)).optional(),
    startAt: vine.date().optional().nullable(),
    endAt: vine.date().optional().nullable()
})

export const createSchema = vine.object({
    name: vine.string(),
    description: vine.string().optional().nullable(),
    url: vine.string().url(),
    processingDate: vine.string()
})
