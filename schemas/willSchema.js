import vine from '@vinejs/vine'
import { myRule, transformEncodedIntegerArray, transformEncodedStringArray } from './validation.js'

export const createSchema = vine.object({
    description: vine.string(),
    categoryId: vine.number(),
    heirs: vine.array(
        vine.object({
            id: vine.number(),
            share: vine.number(),
            constrains: vine.string().optional().nullable()
        })
    ).minLength(1),
    constrains: vine.string().optional().nullable(),
    date: vine.date().optional().nullable(),
    url: vine.string().optional().nullable()
})

export const updateSchema = vine.object({
    description: vine.string(),
    categoryId: vine.number(),
    heirs: vine.array(
        vine.object({
            id: vine.number(),
            share: vine.number(),
            constrains: vine.string().optional().nullable()
        })
    ).minLength(1),
    constrains: vine.string().optional().nullable(),
    date: vine.date().optional().nullable(),
    url: vine.string().optional().nullable()
})

export const filterSchema = vine.object({
    offset: vine.number().min(0).parse(v => v ?? 0),
    limit: vine.number().min(-1).parse(v => v ?? 50),
    search: vine.string().optional().nullable(),
    status: vine.string().use(myRule()).transform((value) => transformEncodedIntegerArray(value)).optional(),
    categories: vine.string().use(myRule()).transform((value) => transformEncodedIntegerArray(value)).optional(),
    orderBy: vine.string().transform((value) => transformEncodedStringArray(value)).optional(),
    startAt: vine.date().optional().nullable(),
    endAt: vine.date().optional().nullable()
})
