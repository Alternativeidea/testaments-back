import { myRule, notEmptyString, transformEncodedIntegerArray, transformEncodedStringArray } from './validation.js'
import vine from '@vinejs/vine'

export const updateSchema = vine.object({
    status: vine.number().min(0)
})

export const filterSchema = vine.object({
    offset: vine.number().min(0).parse(v => v ?? 0),
    limit: vine.number().min(-1).parse(v => v ?? 50),
    search: vine.string().optional().nullable(),
    status: vine.string().use(myRule()).transform((value) => transformEncodedIntegerArray(value)).optional(),
    orderBy: vine.string().transform((value) => transformEncodedStringArray(value)).optional(),
    startAt: vine.date().optional().nullable(),
    endAt: vine.date().optional().nullable()
})

export const contactSChema = vine.object({
    name: vine.string().use(notEmptyString()),
    subject: vine.string().use(notEmptyString()),
    message: vine.string().use(notEmptyString())
})
