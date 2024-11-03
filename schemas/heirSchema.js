import vine from '@vinejs/vine'
import { myRule, notEmptyString, transformEncodedIntegerArray } from './validation.js'

export const createSchema = vine.object({
    name: vine.string(),
    address: vine.string(),
    postcode: vine.string(),
    city: vine.string(),
    phone: vine.string(),
    areaCode: vine.string(),
    email: vine.string().email(),
    residenceCountry: vine.string(),
    relationship: vine.string()
})

export const updateSchema = vine.object({
    name: vine.string().use(notEmptyString()).optional(),
    address: vine.string().use(notEmptyString()).optional(),
    postcode: vine.string().use(notEmptyString()).optional(),
    city: vine.string().use(notEmptyString()).optional(),
    phone: vine.string().use(notEmptyString()).optional(),
    areaCode: vine.string().use(notEmptyString()).optional(),
    email: vine.string().email().use(notEmptyString()).optional(),
    residenceCountry: vine.string().use(notEmptyString()).optional(),
    relationship: vine.string().use(notEmptyString()).optional()
})

export const filterSchema = vine.object({
    offset: vine.number().min(0).parse(v => v ?? 0),
    limit: vine.number().min(-1).parse(v => v ?? 50),
    search: vine.string().optional().nullable(),
    status: vine.string().use(myRule()).transform((value) => transformEncodedIntegerArray(value)).optional()
})
