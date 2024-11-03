import { myRule, transformEncodedIntegerArray } from './validation.js'
import vine from '@vinejs/vine'

export const filterSchema = vine.object({
    section: vine.string().use(myRule()).transform((value) => transformEncodedIntegerArray(value))
})

export const updateSchema = vine.object({
    title: vine.string().optional(),
    subtitle: vine.string().optional(),
    cta: vine.string().optional(),
    ctaLink: vine.string().optional(),
    image: vine.string().optional(),
    status: vine.boolean().optional(),
    section: vine.number().optional(),
    active: vine.boolean().optional()
})
