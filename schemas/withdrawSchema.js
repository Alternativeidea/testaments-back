import { myRule, transformEncodedIntegerArray, transformEncodedStringArray } from './validation.js'
import vine from '@vinejs/vine'

export const filterSchema = vine.object({
    offset: vine.number().min(0).parse(v => v ?? 0),
    limit: vine.number().min(-1).parse(v => v ?? 50),
    search: vine.string().optional().nullable(),
    status: vine.string().use(myRule()).transform((value) => transformEncodedIntegerArray(value)).optional(),
    orderBy: vine.string().transform((value) => transformEncodedStringArray(value)).optional(),
    startAt: vine.date().optional().nullable(),
    endAt: vine.date().optional().nullable(),
    csv: vine.boolean().parse((v) => v ?? false)
})

export const patchSchema = vine.object({
    question: vine.string().optional(),
    response: vine.string().optional(),
    active: vine.boolean().optional(),
    section: vine.number().optional(),
    isFeatured: vine.boolean().optional()
})

export const updateSchema = vine.object({
    status: vine.number().optional(),
    reason: vine.string().optional()
})

export const createSchema = vine.object({
    quantity: vine.number().positive().min(50),
    accountId: vine.number().positive()
})
