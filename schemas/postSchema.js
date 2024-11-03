import { myRule, transformEncodedIntegerArray, transformEncodedStringArray } from './validation.js'
import vine from '@vinejs/vine'

export const createSchema = vine.object({
    title: vine.string(),
    image: vine.string().nullable(),
    resume: vine.string().nullable(),
    content: vine.string(),
    publishedAt: vine.date().optional().nullable(),
    categoryId: vine.number().positive(),
    status: vine.number()
})

export const updateSchema = vine.object({
    title: vine.string().optional(),
    image: vine.string().optional().nullable(),
    resume: vine.string().optional().nullable(),
    content: vine.string().optional().nullable(),
    status: vine.number().optional(),
    publishedAt: vine.date().optional().nullable(),
    categoryId: vine.number().positive().optional()
})

export const patchSchema = vine.object({
    isFeatured: vine.boolean()
})

export const filterSchema = vine.object({
    offset: vine.number().min(0).parse(v => v ?? 0),
    limit: vine.number().min(-1).parse(v => v ?? 50),
    search: vine.string().optional().nullable(),
    status: vine.string().use(myRule()).transform((value) => transformEncodedIntegerArray(value)).optional(),
    orderBy: vine.string().transform((value) => transformEncodedStringArray(value)).optional()
})
