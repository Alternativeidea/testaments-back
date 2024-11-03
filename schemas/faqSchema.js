import { myRule, notEmptyString, transformEncodedIntegerArray } from './validation.js'
import vine from '@vinejs/vine'

export const filterSchema = vine.object({
    section: vine.string().use(myRule()).transform((value) => transformEncodedIntegerArray(value))
})

export const patchSchema = vine.object({
    question: vine.string().optional(),
    response: vine.string().optional(),
    active: vine.boolean().optional(),
    section: vine.number().optional(),
    isFeatured: vine.boolean().optional()
})

export const updateSchema = vine.object({
    question: vine.string().optional(),
    response: vine.string().optional(),
    active: vine.boolean().optional(),
    section: vine.number().optional(),
    isFeatured: vine.boolean().optional()
})

export const createSchema = vine.object({
    question: vine.string().use(notEmptyString()),
    response: vine.string().use(notEmptyString()),
    active: vine.boolean().parse(v => v ?? true),
    section: vine.number(),
    isFeatured: vine.boolean().optional()
})
