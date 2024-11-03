import { myRule, transformEncodedIntegerArray } from './validation.js'
import vine from '@vinejs/vine'

export const filterSchema = vine.object({
    section: vine.string().use(myRule()).transform((value) => transformEncodedIntegerArray(value))
})

export const updateSchema = vine.object({
    title: vine.string().optional(),
    content: vine.string().optional(),
    section: vine.number().optional(),
    status: vine.boolean().optional(),
    active: vine.boolean().optional()
})
