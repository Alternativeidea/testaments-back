import vine from '@vinejs/vine'
import { myRule, notEmptyString, transformEncodedIntegerArray } from './validation.js'

export const createSchema = vine.object({
    name: vine.string().use(notEmptyString()),
    subtitle: vine.string().optional().nullable(),
    price: vine.number().min(0),
    currency: vine.string().optional().nullable(),
    paymentMode: vine.string().optional().nullable(),
    description: vine.string().optional().nullable(),
    image: vine.string().optional().nullable(),
    status: vine.number().optional().nullable(),
    createdAt: vine.date().optional().nullable(),
    updatedAt: vine.date().optional().nullable()
})

export const updateSchema = vine.object({
    name: vine.string().optional().nullable(),
    subtitle: vine.string().optional().nullable(),
    price: vine.number().optional().nullable(),
    currency: vine.string().optional().nullable(),
    paymentMode: vine.string().optional().nullable(),
    description: vine.string().optional().nullable(),
    image: vine.string().optional().nullable(),
    status: vine.number().optional().nullable(),
    createdAt: vine.date().optional().nullable(),
    updatedAt: vine.date().optional().nullable()
})

export const filterSchema = vine.object({
    offset: vine.number().min(0).parse(v => v ?? 0),
    limit: vine.number().min(-1).parse(v => v ?? 50),
    search: vine.string().optional().nullable(),
    status: vine.string().use(myRule()).transform((value) => transformEncodedIntegerArray(value)).optional()
})
